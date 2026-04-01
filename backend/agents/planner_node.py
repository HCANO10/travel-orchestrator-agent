import logging
from typing import Dict, Any
from backend.models.dtos import TravelRequestDTO
from backend.models.mission_state import MissionState
from backend.services.groq_service import groq_service

logger = logging.getLogger(__name__)

async def planner_node(state: MissionState) -> Dict[str, Any]:
    """
    Analiza la entrada inicial del usuario y extrae el TravelRequestDTO.
    Si falta información crítica, genera preguntas de aclaración.
    """
    # Obtenemos el último mensaje del usuario
    messages = state.messages or []
    if not messages:
        return {"status": "error", "error_messages": ["No user message found"]}
    
    last_user_message = messages[-1].get("content", "")
    
    try:
        # Intentar extraer DTO estructurado usando Groq
        system_msg = (
            "Eres un experto extractor de datos de viajes. Extrae destino, origen, "
            "fechas y número de personas. Si no se mencionan, déjalos nulos."
        )
        
        req_data = await groq_service.generate_json(
            prompt=f"Extract travel info from: {last_user_message}",
            system=system_msg
        )
        
        # Validamos con Pydantic
        travel_req = TravelRequestDTO(**req_data)
        
        # Verificar si falta información crítica (Destino y Fechas)
        missing = []
        if not travel_req.destination or travel_req.destination.lower() in ["unknown", ""]:
            missing.append("destino")
        if not travel_req.outbound_date or not travel_req.return_date:
            missing.append("fechas de viaje")
            
        if missing:
            # Generar preguntas inteligentes de aclaración
            known = travel_req.model_dump(exclude_none=True)
            dest = travel_req.destination or "TBD"
            questions = await groq_service.generate_clarification_questions(dest, {"input": last_user_message, "known": known})
            
            return {
                "travel_request": travel_req,
                "status": "clarifying",
                "clarification_questions": questions,
                "nodes_completed": state.nodes_completed + ["planner"]
            }
            
        return {
            "travel_request": travel_req,
            "status": "searching",
            "nodes_completed": state.nodes_completed + ["planner"]
        }
        
    except Exception as e:
        logger.error(f"Planner error: {e}")
        return {
            "status": "error", 
            "error_messages": state.error_messages + [str(e)],
            "nodes_completed": state.nodes_completed + ["planner"]
        }
