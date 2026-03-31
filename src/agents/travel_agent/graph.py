from typing import List, Dict, Any, Optional, Literal, Union
from datetime import date, datetime
from langgraph.graph import StateGraph, END, START
import traceback

# Nuevas importaciones de servicios y modelos
from backend.models.dtos import (
    TravelRequestDTO, 
    FlightDTO, 
    AccommodationDTO, 
    ActivityDTO, 
    DayPlan
)
from backend.models.mission_state import MissionState
from backend.services.groq_service import groq_service
from backend.services.search_service import search_service

# 1. Definición de Nodos de la Misión

async def planner_node(state: MissionState) -> Dict[str, Any]:
    """
    Analiza la entrada inicial del usuario y extrae el TravelRequestDTO.
    Si falta información crítica, genera preguntas de aclaración.
    """
    # Obtenemos el último mensaje del usuario
    messages = state.get("messages", [])
    if not messages:
        return {"status": "error", "error_messages": ["No user message found"]}
    
    last_user_message = messages[-1].get("content", "")
    
    try:
        # Intentar extraer DTO estructurado usando Groq
        system_msg = (
            "Eres un experto extractor de datos de viajes. Extrae destino, origen, "
            "fechas y número de personas. Si no se mencionan, déjalos nulos."
        )
        # Usamos generate_json para obtener el DTO (Simulamos la estructura de TravelRequestDTO)
        # En una versión real, usaríamos with_structured_output si el wrapper lo soportara directamente,
        # pero aquí usamos nuestra implementación robusta de generate_json.
        req_data = await groq_service.generate_json(
            prompt=f"Extract travel info from: {last_user_message}",
            system=system_msg
        )
        
        # Validamos con Pydantic (esto activará las validaciones por defecto)
        # Nota: Ajustamos nombres de campos si es necesario (pax_adults vs num_passengers)
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
                "nodes_completed": state.get("nodes_completed", []) + ["planner"]
            }
            
        return {
            "travel_request": travel_req,
            "status": "searching",
            "nodes_completed": state.get("nodes_completed", []) + ["planner"]
        }
        
    except Exception as e:
        print(f"Planner error: {e}")
        return {"status": "error", "error_messages": [str(e)]}

async def flight_searcher_node(state: MissionState) -> Dict[str, Any]:
    """Busca vuelos reales usando SearchService."""
    req = state.get("travel_request")
    if not req:
        return {"status": "error", "error_messages": ["Missing travel request"]}
    
    try:
        flights = await search_service.search_flights(
            origin=req.origin,
            destination=req.destination,
            outbound_date=req.outbound_date,
            return_date=req.return_date
        )
        return {
            "flights": flights,
            "nodes_completed": state.get("nodes_completed", []) + ["flight_searcher"]
        }
    except Exception as e:
        return {"error_messages": [f"Flight search failed: {str(e)}"]}

async def hotel_searcher_node(state: MissionState) -> Dict[str, Any]:
    """Busca alojamientos reales usando SearchService y los clasifica."""
    req = state.get("travel_request")
    if not req:
        return {"status": "error", "error_messages": ["Missing travel request"]}
    
    try:
        accommodations = await search_service.search_accommodations(
            destination=req.destination,
            checkin=req.outbound_date,
            checkout=req.return_date
        )
        
        # Clasificar por Tiers (la lógica ya está en el validator de AccommodationDTO)
        budget = [a for a in accommodations if a.tier == "budget"]
        comfort = [a for a in accommodations if a.tier == "comfort"]
        premium = [a for a in accommodations if a.tier == "premium"]
        
        return {
            "accommodations_budget": budget,
            "accommodations_comfort": comfort,
            "accommodations_premium": premium,
            "nodes_completed": state.get("nodes_completed", []) + ["hotel_searcher"]
        }
    except Exception as e:
        return {"error_messages": [f"Hotel search failed: {str(e)}"]}

async def orchestrator_node(state: MissionState) -> Dict[str, Any]:
    """Genera el itinerario final y consolida el presupuesto."""
    req = state.get("travel_request")
    # Elegimos el mejor hotel disponible para el itinerario base (preferencia Comfort)
    selected_acc = (state.get("accommodations_comfort") or 
                    state.get("accommodations_premium") or 
                    state.get("accommodations_budget") or [None])[0]
    
    try:
        # 1. Investigación complementaria si es necesario (implícito en el prompt de itinerario)
        # 2. Generar Itinerario usando GroqService
        num_days = (req.return_date - req.outbound_date).days + 1
        
        # Preparar contexto de actividades (podemos buscar algunas genéricas aquí o enviarlas al LLM)
        itinerary_data = await groq_service.generate_itinerary(
            destination=req.destination,
            num_days=num_days,
            travel_style=req.travel_style,
            interests=req.interests,
            accommodation_address=selected_acc.address if selected_acc else "Centro ciudad",
            activities_context="Top landmarks and local secrets",
            weather_context="Pronóstico estacional estándar"
        )
        
        # Convertir datos de Groq a DayPlan DTOs con normalización de tipos
        def _normalize_type(raw: str) -> str:
            r = raw.lower().strip()
            if any(x in r for x in ["landmark", "historic", "museum", "church", "monument", "art", "cultural", "architecture", "square", "plaza", "piazza"]):
                return "cultural"
            elif any(x in r for x in ["restaurant", "food", "eat", "dinner", "lunch", "market", "gastro", "cafe", "pizza"]):
                return "food"
            elif any(x in r for x in ["park", "nature", "garden", "hike", "beach", "lake", "mountain", "forest"]):
                return "nature"
            elif any(x in r for x in ["adventure", "sport", "climb", "dive", "surf"]):
                return "adventure"
            elif any(x in r for x in ["shop", "mall", "store", "boutique"]):
                return "shopping"
            elif r in ("cultural", "nature", "food", "adventure", "relax", "shopping"):
                return r
            return "relax"

        itinerary = []
        for day in itinerary_data:
            if isinstance(day, dict):
                for act in day.get("activities", []):
                    if isinstance(act, dict):
                        act["type"] = _normalize_type(act.get("type", "relax"))
                        act.setdefault("source", "groq")
                        act.setdefault("description", "")
                day.setdefault("summary", None)
                day.setdefault("weather_summary", None)
                day.setdefault("transport_notes", None)
                day.setdefault("meals", [])
            itinerary.append(DayPlan(**day))
        
        # 3. Calcular presupuesto estimado total
        total_budget = 0.0
        if state.get("flights"):
            total_budget += state["flights"][0].total_price_pax
        if selected_acc:
            total_budget += selected_acc.total_stay_price
        
        return {
            "itinerary": itinerary,
            "selected_accommodation": selected_acc,
            "total_estimated_budget": total_budget,
            "status": "itinerary",
            "nodes_completed": state.get("nodes_completed", []) + ["orchestrator"]
        }
    except Exception as e:
        print(f"Orchestration error: {e}")
        return {"status": "error", "error_messages": [str(e)]}

# 2. Lógica de Control de Flujo (Conditional Edges)

def route_after_planning(state: MissionState) -> Literal["clarify", "search"]:
    if state.get("status") == "clarifying":
        return "clarify"
    return "search"

def route_after_search(state: MissionState) -> Literal["orchestrate", "wait"]:
    # Esperamos a que ambos buscadores (vuelos y hoteles) terminen
    completed = state.get("nodes_completed", [])
    if "flight_searcher" in completed and "hotel_searcher" in completed:
        return "orchestrate"
    return "wait"

# 3. Construcción del Grafo

workflow = StateGraph(MissionState)

# Añadir Nodos
workflow.add_node("planner", planner_node)
workflow.add_node("flight_searcher", flight_searcher_node)
workflow.add_node("hotel_searcher", hotel_searcher_node)
workflow.add_node("orchestrator", orchestrator_node)

# Configurar Bordes
workflow.add_edge(START, "planner")

workflow.add_conditional_edges(
    "planner",
    route_after_planning,
    {
        "clarify": END, # El usuario debe responder
        "search": "flight_searcher"
    }
)

# Ejecución paralela
workflow.add_edge("planner", "hotel_searcher") 

# Sincronización para orquestación
workflow.add_edge("flight_searcher", "orchestrator")
workflow.add_edge("hotel_searcher", "orchestrator")

workflow.add_edge("orchestrator", END)

# 4. Compilación
compiled_graph = workflow.compile()
