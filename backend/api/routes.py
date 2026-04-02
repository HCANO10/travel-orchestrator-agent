import re
import time
import logging
import os
from fastapi import APIRouter, HTTPException, BackgroundTasks, Request, Security
from fastapi.responses import StreamingResponse
from fastapi.security import APIKeyHeader
from pydantic import BaseModel, Field
import json
import asyncio
from backend.models.mission_state import MissionState
from backend.services.cache_service import cache_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/travel", tags=["Orchestrator"])

# ── API Key Auth ───────────────────────────────────────────────────────────────
_API_KEY_NAME = "X-API-Key"
_api_key_header = APIKeyHeader(name=_API_KEY_NAME, auto_error=False)

async def verify_api_key(api_key: str = Security(_api_key_header)) -> None:
    """Valida la API key del header X-API-Key. Si no está configurada en el entorno, permite todo (modo desarrollo)."""
    expected_key = os.getenv("API_KEY")
    if not expected_key:
        # No hay API_KEY configurada → modo desarrollo, sin restricción
        return
    if api_key != expected_key:
        raise HTTPException(status_code=401, detail="API Key inválida o ausente.")

# ── Sanitización de prompts ────────────────────────────────────────────────────
_INJECTION_PATTERNS = re.compile(
    r"(system\s*:|instruction\s*:|<\s*/?system\s*>|<\s*/?instruction\s*>|"
    r"ignore\s+(previous|all)\s+instructions?|forget\s+everything|"
    r"act\s+as\s+|you\s+are\s+now\s+|jailbreak|prompt\s+injection)",
    re.IGNORECASE
)

def sanitize_prompt(prompt: str) -> str:
    """Elimina patrones de inyección de prompts y normaliza el texto."""
    cleaned = _INJECTION_PATTERNS.sub("", prompt)
    # Colapsar espacios múltiples generados por la limpieza
    cleaned = re.sub(r"\s{2,}", " ", cleaned).strip()
    if len(cleaned) < 10:
        raise ValueError("El prompt quedó demasiado corto tras la sanitización.")
    return cleaned

class TravelRequestDTO(BaseModel):
    user_id: str = Field(..., max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    prompt: str = Field(..., min_length=10, max_length=1000)

class TravelResponseDTO(BaseModel):
    mission_id: str
    status: str
    message: str

from src.agents.travel_agent.graph import compiled_graph

async def run_mission_and_track(mission_id: str, initial_state: MissionState):
    """
    Wrapper para ejecutar la misión y actualizar la caché de estado en tiempo real.
    """
    # Establecer estado inicial
    await cache_service.update_mission_status(mission_id, {"status": "init", "nodes_completed": []})
    
    try:
        async for event in compiled_graph.astream(initial_state):
            # LangGraph astream retorna diccionarios con el nombre del nodo como clave
            for node_name, state_update in event.items():
                # Actualizar progreso en la caché transitoria
                await cache_service.update_mission_status(mission_id, state_update)
                logger.info(f"Misión {mission_id}: Nodo '{node_name}' completado.")
        
        # Una vez terminado el astream, marcar como finalizado si no hubo error
        status = await cache_service.get_mission_status(mission_id)
        if status and status.get("status") != "error":
            await cache_service.update_mission_status(mission_id, {"status": "done"})
            
    except Exception as e:
        logger.error(f"Error en ejecución de misión {mission_id}: {str(e)}")
        await cache_service.update_mission_status(mission_id, {
            "status": "error",
            "error_messages": [str(e)]
        })

@router.post("/plan", response_model=TravelResponseDTO, dependencies=[Security(verify_api_key)])
async def plan_travel(request: TravelRequestDTO, background_tasks: BackgroundTasks):
    """
    Endpoint principal para iniciar una misión de planificación de viajes.
    """
    mission_id = f"mission_{request.user_id}_{int(time.time())}"

    try:
        safe_prompt = sanitize_prompt(request.prompt)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        # Inicialización del estado asíncrono Pydantic v2
        initial_state = MissionState(
            mission_id=mission_id, 
            messages=[{"role": "user", "content": safe_prompt}],
            status="pending"
        )
        
        # Encolado en BackgroundTasks de FastAPI (Wrapper con tracking)
        # Store user_id in cache so Supabase persistence can link the mission
        await cache_service.update_mission_status(mission_id, {"user_id": request.user_id})
        background_tasks.add_task(run_mission_and_track, mission_id, initial_state)
        
        logger.info(f"Misión {mission_id} iniciada para el usuario {request.user_id} via LangGraph.")
        
        return TravelResponseDTO(
            mission_id=mission_id,
            status="ACCEPTED",
            message="Misión asíncrona iniciada en background."
        )
    except Exception as e:
        logger.error(f"Error al iniciar misión {mission_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno al encolar la misión.")

@router.get("/stream/{mission_id}")
async def stream_mission_status(mission_id: str, request: Request):
    """
    Endpoint Server-Sent Events (SSE) para transmitir el progreso del agente.
    Permite al frontend mostrar en tiempo real qué nodo se está ejecutando.
    """
    async def event_generator():
        previous_nodes = []
        previous_status = None
        last_heartbeat = time.time()

        # Timeout de seguridad: 20 minutos
        start_time = time.time()

        while time.time() - start_time < 1200:
            if await request.is_disconnected():
                logger.info(f"Cliente desconectado del stream {mission_id}")
                break

            current_state = await cache_service.get_mission_status(mission_id)

            if current_state:
                current_nodes = current_state.get("nodes_completed", [])
                current_status = current_state.get("status")

                # Enviar evento si hay cambio
                if current_nodes != previous_nodes or current_status != previous_status:
                    payload = {
                        "mission_id": mission_id,
                        "nodes_completed": current_nodes,
                        "status": current_status,
                        "type": "progress"
                    }
                    # Incluir mensajes de error si la misión falló
                    if current_status == "error":
                        payload["error_messages"] = current_state.get("error_messages", [])
                        payload["type"] = "error"
                    yield f"data: {json.dumps(payload)}\n\n"
                    previous_nodes = list(current_nodes)
                    previous_status = current_status
                    last_heartbeat = time.time()

                # Detener el stream al terminar
                if current_status in ["done", "error", "clarifying"]:
                    # Emitir evento final con estado completo
                    final_payload = {
                        "type": "done" if current_status == "done" else current_status,
                        "mission_id": mission_id,
                        "status": current_status,
                        "nodes_completed": current_nodes
                    }
                    yield f"data: {json.dumps(final_payload)}\n\n"
                    break

            # Heartbeat cada 30s para mantener la conexión viva
            if time.time() - last_heartbeat >= 30:
                yield f"data: {json.dumps({'type': 'ping', 'mission_id': mission_id})}\n\n"
                last_heartbeat = time.time()

            await asyncio.sleep(1)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/mission/{mission_id}")
async def get_mission_state(mission_id: str):
    """Retorna el estado completo de una misión (vuelos, hoteles, itinerario)."""
    state = await cache_service.get_mission_status(mission_id)
    if not state:
        raise HTTPException(status_code=404, detail="Mission not found")
    total_nodes = 5
    progress = min((len(state.get("nodes_completed", [])) / total_nodes) * 100, 100.0)
    return {"state": state, "progress_percent": progress}


@router.get("/mission/{mission_id}/summary")
async def get_mission_summary(mission_id: str):
    """Retorna el resumen formateado de una misión completada."""
    state = await cache_service.get_mission_status(mission_id)
    if not state:
        raise HTTPException(status_code=404, detail="Mission not found")
    request = state.get("travel_request") or {}
    dest = request.get("destination", "Desconocido") if isinstance(request, dict) else getattr(request, "destination", "Desconocido")
    return {
        "mission_id": mission_id,
        "destination": dest,
        "flights": state.get("flights", []),
        "accommodations": {
            "budget": state.get("accommodations_budget", []),
            "comfort": state.get("accommodations_comfort", []),
            "premium": state.get("accommodations_premium", []),
        },
        "itinerary": state.get("itinerary", []),
        "total_budget": state.get("total_estimated_budget", 0.0),
        "executive_summary": state.get("research_context", ""),
        "nodes_completed": state.get("nodes_completed", []),
        "status": state.get("status", "unknown"),
    }


@router.post("/mission/{mission_id}/answer")
async def answer_clarifications(mission_id: str, payload: dict, background_tasks: BackgroundTasks):
    """Recibe respuestas del usuario y reanuda la misión."""
    state = await cache_service.get_mission_status(mission_id)
    if not state:
        raise HTTPException(status_code=404, detail="Mission not found")
    answers = payload.get("answers", {})
    state.update(answers)
    state["clarifications_answered"] = True
    state["status"] = "searching"
    await cache_service.update_mission_status(mission_id, state)
    return {"mission_id": mission_id, "status": "resumed"}


@router.get("/health")
async def health_check():
    return {"status": "ok", "version": "5.0.0"}
