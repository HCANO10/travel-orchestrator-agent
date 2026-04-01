from typing import Literal
from langgraph.graph import StateGraph, END, START

# Modelos y Estado
from backend.models.mission_state import MissionState

# Importación centralizada de nodos desde el backend
from backend.agents.ai_prompter_node import ai_prompter_node
from backend.agents.planner_node import planner_node
from backend.agents.flight_searcher_node import flight_searcher_node
from backend.agents.hotel_searcher_node import hotel_searcher_node
from backend.agents.itinerary_node import itinerary_node
from backend.agents.orchestrator_node import orchestrator_node

# 1. Lógica de Control de Flujo (Conditional Edges)

def route_after_prompter(state: MissionState) -> Literal["clarify", "plan"]:
    """Si el ai_prompter detecta que necesita aclaraciones, detiene el flujo."""
    if state.status == "clarifying":
        return "clarify"
    return "plan"

def route_after_planning(state: MissionState) -> Literal["clarify", "search"]:
    """Determina si el planner necesita aclaraciones adicionales o procede a búsqueda."""
    if state.status == "clarifying":
        return "clarify"
    return "search"

# 2. Construcción del Grafo

workflow = StateGraph(MissionState)

# Añadir Nodos
workflow.add_node("ai_prompter", ai_prompter_node)
workflow.add_node("planner", planner_node)
workflow.add_node("flight_searcher", flight_searcher_node)
workflow.add_node("hotel_searcher", hotel_searcher_node)
workflow.add_node("itinerary_manager", itinerary_node)
workflow.add_node("orchestrator", orchestrator_node)

# Configurar Bordes y Flujo
# START → ai_prompter (decide si necesita aclaraciones antes de planificar)
workflow.add_edge(START, "ai_prompter")

workflow.add_conditional_edges(
    "ai_prompter",
    route_after_prompter,
    {
        "clarify": END,   # Detenerse: el frontend preguntará al usuario
        "plan": "planner" # Continuar con la planificación completa
    }
)

# Transición desde Planner (segunda oportunidad de aclaración)
workflow.add_conditional_edges(
    "planner",
    route_after_planning,
    {
        "clarify": END,
        "search": "hotel_searcher"
    }
)

# Flujo secuencial de búsqueda: Hotel → Flight → Itinerary → Orchestrator
workflow.add_edge("hotel_searcher", "flight_searcher")
workflow.add_edge("flight_searcher", "itinerary_manager")
workflow.add_edge("itinerary_manager", "orchestrator")
workflow.add_edge("orchestrator", END)

# 3. Compilación
compiled_graph = workflow.compile()
