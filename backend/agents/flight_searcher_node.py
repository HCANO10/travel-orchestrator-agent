import logging
from typing import Dict, Any
from backend.models.mission_state import MissionState
from backend.services.search_service import search_service

logger = logging.getLogger(__name__)

async def flight_searcher_node(state: MissionState) -> Dict[str, Any]:
    """Busca vuelos reales usando SearchService."""
    req = state.travel_request
    if not req or not req.destination:
        logger.warning(f"No travel request or destination found in mission state.")
        return {"nodes_completed": state.nodes_completed + ["flight_searcher"]}
    
    try:
        flights = await search_service.search_flights(
            origin=req.origin,
            destination=req.destination,
            outbound_date=req.outbound_date,
            return_date=req.return_date
        )
        return {
            "flights": [f.model_dump(mode="json") for f in flights],
            "nodes_completed": state.nodes_completed + ["flight_searcher"]
        }
    except Exception as e:
        logger.error(f"Flight search error: {str(e)}")
        return {
            "error_messages": state.error_messages + [f"Flight search failed: {str(e)}"],
            "nodes_completed": state.nodes_completed + ["flight_searcher"]
        }
