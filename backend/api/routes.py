import asyncio
import logging
from uuid import uuid4
from typing import Dict, List, Optional, Any
from datetime import date

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

from backend.models.mission_state import MissionState
from backend.models.dtos import TravelRequestDTO, FlightDTO, AccommodationDTO, DayPlan
from src.agents.travel_agent.graph import compiled_graph

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1")

# In-memory mission store
missions: Dict[str, MissionState] = {}

class AnswerPayload(BaseModel):
    answers: Dict[str, Any]

async def run_graph(mission_id: str, resume_from: str = "planner"):
    """
    Ejecuta el grafo de LangGraph para una misión específica.
    Actualiza el estado global de la misión después de cada paso.
    """
    try:
        state = missions.get(mission_id)
        if not state:
            logger.error(f"Mission {mission_id} not found in store.")
            return

        # Configuración inicial del grafo si es nuevo
        # En LangGraph cada nodo devuelve un dict que se mezcla con el estado
        async for output in compiled_graph.astream(state):
            for node_name, partial_state in output.items():
                logger.info(f"Node {node_name} completed for mission {mission_id}")
                # Actualizar el estado en memoria
                missions[mission_id].update(partial_state)
                
    except Exception as e:
        logger.error(f"Error running graph for mission {mission_id}: {str(e)}")
        if mission_id in missions:
            missions[mission_id]["status"] = "error"
            missions[mission_id]["error_messages"].append(f"Graph execution error: {str(e)}")

@router.post("/mission")
async def create_mission(request: TravelRequestDTO):
    """ Crea una nueva misión de viaje e inicia el grafo. """
    mission_id = str(uuid4())
    
    # Inicialización del estado completo
    new_state: MissionState = {
        "id": mission_id,
        "status": "init",
        "travel_request": request,
        "clarification_questions": [],
        "clarifications_answered": False,
        "research_context": "",
        "flights": [],
        "accommodations_budget": [],
        "accommodations_comfort": [],
        "accommodations_premium": [],
        "selected_accommodation": None,
        "itinerary": [],
        "total_estimated_budget": 0.0,
        "nodes_completed": [],
        "error_messages": [],
        "messages": []
    }
    
    missions[mission_id] = new_state
    
    # Lanzar ejecución en segundo plano
    asyncio.create_task(run_graph(mission_id))
    
    return {"mission_id": mission_id, "status": "init"}

@router.get("/mission/{mission_id}")
async def get_mission(mission_id: str):
    """ Obtiene el estado completo de una misión y el porcentaje de progreso. """
    state = missions.get(mission_id)
    if not state:
        raise HTTPException(status_code=404, detail="Mission not found")
        
    # Calcular progreso basado en nodos esperados (aprox 7: planner, prompter, flight, hotel, activity, itinerary, orchestrator)
    # Ajustamos a 5 nodos principales definidos en el flujo actual
    total_nodes = 6 
    progress = (len(state.get("nodes_completed", [])) / total_nodes) * 100
    
    return {
        "state": state,
        "progress_percent": min(progress, 100.0)
    }

@router.post("/mission/{mission_id}/answer")
async def answer_clarifications(mission_id: str, payload: Dict[str, Any]):
    """ Procesa las respuestas del usuario y reanuda el grafo. """
    state = missions.get(mission_id)
    if not state:
        raise HTTPException(status_code=404, detail="Mission not found")
        
    # Actualizar campos de travel_request con las respuestas
    answers = payload.get("answers", {})
    request = state["travel_request"]
    
    for key, value in answers.items():
        if hasattr(request, key):
            setattr(request, key, value)
            
    state["clarifications_answered"] = True
    state["status"] = "searching"
    
    # Reanudar ejecución (el grafo LangGraph decide hacia dónde ir basado en el estado)
    asyncio.create_task(run_graph(mission_id))
    
    return missions[mission_id]

@router.get("/mission/{mission_id}/summary")
async def get_mission_summary(mission_id: str):
    """ Devuelve un objeto de resumen formateado para el frontend. """
    state = missions.get(mission_id)
    if not state:
        raise HTTPException(status_code=404, detail="Mission not found")
        
    request = state.get("travel_request")
    
    return {
        "mission_id": mission_id,
        "destination": request.destination if request else "Desconocido",
        "dates": {
            "outbound": str(request.outbound_date) if request else "",
            "return": str(request.return_date) if request else ""
        },
        "flights": state.get("flights", []),
        "accommodations": {
            "budget": state.get("accommodations_budget", []),
            "comfort": state.get("accommodations_comfort", []),
            "premium": state.get("accommodations_premium", [])
        },
        "itinerary": state.get("itinerary", []),
        "total_budget": state.get("total_estimated_budget", 0.0),
        "executive_summary": state.get("research_context", ""),
        "nodes_completed": state.get("nodes_completed", []),
        "status": state.get("status", "unknown")
    }

@router.get("/health")
async def health_check():
    return {"status": "ok", "version": "4.0.0"}
