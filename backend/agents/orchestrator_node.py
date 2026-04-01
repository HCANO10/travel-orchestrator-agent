import logging
from typing import Dict, Any
from backend.models.mission_state import MissionState
from backend.services.groq_service import groq_service

logger = logging.getLogger(__name__)

async def orchestrator_node(state: MissionState) -> Dict[str, Any]:
    """
    Nodo final que consolida el presupuesto y genera un resumen ejecutivo.
    Alineado con Pydantic v2 y arquitectura asíncrona.
    """
    try:
        # 1. Consolidación de presupuesto
        # Acceso directo a atributos de MissionState (BaseModel)
        flights = state.flights or []
        accommodations_comfort = state.accommodations_comfort or []
        itinerary_costs = state.total_estimated_budget or 0.0
        
        # Vuelo más barato
        cheapest_flight = min([f.get("total_price_pax", 0.0) for f in flights if f.get("total_price_pax", 0.0) > 0], default=0.0)
        
        # Hotel más barato (tier comfort)
        cheapest_hotel = min([h.get("total_stay_price", 0.0) for h in accommodations_comfort if h.get("total_stay_price", 0.0) > 0], default=0.0)
        
        # Presupuesto total consolidado
        total_budget = cheapest_flight + cheapest_hotel + itinerary_costs

        # 2. Generación de resumen ejecutivo vía Groq
        request = state.travel_request
        destination = request.destination or "tu destino" if request else "tu destino"
        
        # Cálculo de días (manejo seguro de nulos)
        num_days = 0
        if request and request.outbound_date and request.return_date:
            num_days = (request.return_date - request.outbound_date).days + 1
            
        travel_style = request.travel_style or "personalizado" if request else "personalizado"
        
        total_hotels = len(state.accommodations_budget or []) + \
                       len(state.accommodations_comfort or []) + \
                       len(state.accommodations_premium or [])
                       
        prompt = f"""
        Resume este plan de viaje en máximo 3 oraciones en español para el viajero:
        Destino: {destination}
        Días: {num_days}
        Estilo de viaje: {travel_style}
        Vuelos encontrados: {len(flights)} opciones
        Hoteles encontrados: {total_hotels} opciones (Budget/Comfort/Premium)
        Itinerario: {len(state.itinerary)} días planificados
        Presupuesto total estimado: {total_budget}€
        Escribe un resumen cálido y entusiasta destacando lo mejor. Responde SOLO con el texto del resumen.
        """
        
        summary = await groq_service.generate_text(prompt, max_tokens=300)

        # 3. Retorno de actualización de estado
        return {
            "total_estimated_budget": total_budget,
            "research_context": summary,
            "nodes_completed": state.nodes_completed + ["orchestrator"],
            "status": "done"
        }

    except Exception as e:
        logger.error(f"Orchestrator error: {str(e)}")
        return {
            "total_estimated_budget": state.total_estimated_budget,
            "nodes_completed": state.nodes_completed + ["orchestrator"],
            "status": "done",
            "error_messages": state.error_messages + [f"Orchestrator error: {str(e)}"]
        }
