import logging
from backend.models.mission_state import MissionState
from backend.services.groq_service import groq_service

logger = logging.getLogger(__name__)

async def ai_prompter_node(state: MissionState) -> dict:
    """
    Nodo de pre-procesamiento IA que decide si se necesitan aclaraciones del usuario
    antes de proceder con la búsqueda de vuelos y hoteles.
    """
    try:
        # 1. Extract from state
        request = state.get("travel_request")
        if not request:
            raise ValueError("Travel request not found in mission state.")

        destination = request.destination
        travel_style = request.travel_style
        interests = request.interests
        outbound_date = request.outbound_date
        return_date = request.return_date
        num_passengers = request.num_passengers
        
        # Calculate number of days
        num_days = (return_date - outbound_date).days

        # 2. Decide if clarification is needed
        needs_clarification = False
        
        # Conditions for needing clarification
        if travel_style == "mixed" and not interests:
            needs_clarification = True
        elif num_days > 5 and travel_style == "mixed":
            needs_clarification = True
        else:
            # Check for specific logistics (islands, coastal areas, etc.)
            logistics_keywords = [
                "isla", "island", "rural", "costa", "coast", "amalfi", 
                "sicilia", "mallorca", "ibiza", "canarias", "azores", 
                "grecia", "greece"
            ]
            if any(kw in destination.lower() for kw in logistics_keywords) and not request.needs_car_rental:
                needs_clarification = True

        # Overriding conditions for NOT needing clarification
        if num_days <= 2:
            needs_clarification = False
        elif travel_style != "mixed" and len(interests) >= 2:
            needs_clarification = False

        # 3. Handle clarification if needed
        if needs_clarification:
            known_data = request.model_dump(exclude_none=True)
            
            questions = await groq_service.generate_clarification_questions(
                destination=destination,
                known_data=known_data
            )
            
            return {
                "clarification_questions": questions,
                "clarifications_answered": False,
                "nodes_completed": state.get("nodes_completed", []) + ["ai_prompter"],
                "status": "clarifying"
            }

        # 4. If no clarification is needed
        logger.info(f"No clarification needed for {destination}, proceeding to search")
        return {
            "clarification_questions": [],
            "clarifications_answered": True,
            "nodes_completed": state.get("nodes_completed", []) + ["ai_prompter"],
            "status": "searching"
        }

    except Exception as e:
        # 5. Wrap entire function in try/except (Never block the pipeline)
        logger.error(f"AI prompter error: {str(e)}")
        return {
            "clarifications_answered": True,
            "nodes_completed": state.get("nodes_completed", []) + ["ai_prompter"],
            "status": "searching",
            "error_messages": state.get("error_messages", []) + [f"AI prompter error: {str(e)}"]
        }
