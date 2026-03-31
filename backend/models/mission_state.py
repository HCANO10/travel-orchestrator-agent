from typing import TypedDict, List, Optional, Literal, Dict, Any, Annotated
import operator
from backend.models.dtos import FlightDTO, AccommodationDTO, ActivityDTO, DayPlan, TravelRequestDTO

class MissionState(TypedDict):
    """
    Estado de la misión del agente de viajes para compatibilidad con LangGraph.
    Utiliza Tipado Fuerte para asegurar la integridad de los datos en el flujo.
    """
    id: str
    status: Literal["init", "planning", "clarifying", "searching", "itinerary", "done", "error"]
    travel_request: Optional[TravelRequestDTO]
    clarification_questions: List[Dict[str, Any]]
    clarifications_answered: bool
    research_context: str
    flights: List[FlightDTO]
    accommodations_budget: Annotated[List[AccommodationDTO], operator.add]
    accommodations_comfort: Annotated[List[AccommodationDTO], operator.add]
    accommodations_premium: Annotated[List[AccommodationDTO], operator.add]
    selected_accommodation: Optional[AccommodationDTO]
    itinerary: List[DayPlan]
    total_estimated_budget: Optional[float]
    nodes_completed: Annotated[List[str], operator.add]
    error_messages: Annotated[List[str], operator.add]
    messages: Annotated[List[Dict[str, Any]], operator.add] # Lista compatible con LangGraph Messages
