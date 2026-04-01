import asyncio
import logging
from typing import Dict, Any
from backend.models.mission_state import MissionState
from backend.services.search_service import search_service

logger = logging.getLogger(__name__)

async def hotel_searcher_node(state: MissionState) -> Dict[str, Any]:
    """
    Nodo de búsqueda de hoteles usando asyncio.gather para máxima concurrencia.
    Implementa un hard timeout para evitar bloqueos en el Event Loop.
    """
    # 1. Extracción de datos del TravelRequestDTO
    req = state.travel_request
    if not req or not req.destination:
        logger.warning(f"No se encontró destino válido en mission_id: {state.mission_id}")
        return {"hotels": [], "nodes_completed": state.nodes_completed + ["hotel_searcher"]}

    destination = req.destination
    logger.info(f"Iniciando búsqueda concurrente de hoteles en {destination}.")
    
    try:
        # Búsqueda usando el nuevo método async del servicio
        # Nota: Aquí podríamos buscar en múltiples destinos si el request lo permite,
        # pero de momento buscamos por el destino principal.
        accommodations = await asyncio.wait_for(
            search_service.search_accommodations(
                destination=destination,
                checkin=req.outbound_date,
                checkout=req.return_date
            ),
            timeout=15.0
        )
        
        # Clasificar por Tiers (la lógica ya está en el validator de AccommodationDTO)
        budget = [a.model_dump(mode="json") for a in accommodations if a.tier == "budget"]
        comfort = [a.model_dump(mode="json") for a in accommodations if a.tier == "comfort"]
        premium = [a.model_dump(mode="json") for a in accommodations if a.tier == "premium"]
        
        return {
            "accommodations_budget": budget,
            "accommodations_comfort": comfort,
            "accommodations_premium": premium,
            "nodes_completed": state.nodes_completed + ["hotel_searcher"]
        }
    except asyncio.TimeoutError:
        logger.error(f"Timeout de 15s en hotel_searcher para {destination}")
        return {
            "error_messages": state.error_messages + [f"Hotel search timeout for {destination}"],
            "nodes_completed": state.nodes_completed + ["hotel_searcher"]
        }
    except Exception as e:
        logger.error(f"Hotel search error: {str(e)}")
        return {
            "error_messages": state.error_messages + [f"Hotel search failed: {str(e)}"],
            "nodes_completed": state.nodes_completed + ["hotel_searcher"]
        }
