import logging
from typing import Dict, Any
from backend.models.mission_state import MissionState
from backend.services.groq_service import groq_service

logger = logging.getLogger(__name__)

async def orchestrator_node(state: MissionState) -> Dict[str, Any]:
    """
    Nodo final que consolida el presupuesto y genera un resumen ejecutivo.
    """
    try:
        # 1. Calculate total_estimated_budget
        # Extract individual components
        flights = state.get("flights", [])
        accommodations_comfort = state.get("accommodations_comfort", [])
        itinerary_costs = state.get("total_estimated_budget", 0.0) # From itinerary_node (activities + food)
        
        # Cheapest flight
        cheapest_flight = min([f.total_price_pax for f in flights if f.total_price_pax > 0], default=0.0)
        
        # Cheapest comfort hotel
        cheapest_hotel = min([h.total_stay_price for h in accommodations_comfort if h.total_stay_price > 0], default=0.0)
        
        # Total consolidated budget
        total_budget = cheapest_flight + cheapest_hotel + itinerary_costs

        # 2. Generate executive summary via Groq
        request = state.get("travel_request")
        destination = request.destination if request else "tu destino"
        num_days = (request.return_date - request.outbound_date).days if request else 0
        travel_style = request.travel_style if request else "personalizado"
        
        total_hotels = len(state.get("accommodations_budget", [])) + \
                       len(state.get("accommodations_comfort", [])) + \
                       len(state.get("accommodations_premium", []))
                       
        prompt = f"""
        Resume este plan de viaje en máximo 3 oraciones en español para el viajero:
        Destino: {destination}
        Días: {num_days}
        Estilo de viaje: {travel_style}
        Vuelos encontrados: {len(flights)} opciones
        Hoteles encontrados: {total_hotels} opciones (Budget/Comfort/Premium)
        Itinerario: {len(state.get('itinerary', []))} días planificados
        Presupuesto total estimado: {total_budget}€
        Escribe un resumen cálido y entusiasta destacando lo mejor. Responde SOLO con el texto del resumen.
        """
        
        summary = await groq_service.generate_text(prompt, max_tokens=300)

        # 3. Return state update
        current_completed = state.get("nodes_completed", [])
        return {
            "total_estimated_budget": total_budget,
            "research_context": summary,
            "nodes_completed": current_completed + ["orchestrator"],
            "status": "done"
        }

    except Exception as e:
        logger.error(f"Orchestrator error: {str(e)}")
        current_completed = state.get("nodes_completed", [])
        current_errors = state.get("error_messages", [])
        return {
            "total_estimated_budget": state.get("total_estimated_budget", 0.0),
            "nodes_completed": current_completed + ["orchestrator"],
            "status": "done",
            "error_messages": current_errors + [f"Orchestrator error: {str(e)}"]
        }
