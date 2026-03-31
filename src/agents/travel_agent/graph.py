from typing import List, TypedDict, Annotated, Union, Optional
from langgraph.graph import StateGraph, END, START
from langchain_groq import ChatGroq
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage

from src.agents.travel_agent.schemas import TravelRequestDTO, AccommodationDTO, FlightDTO, TransportDTO, TravelProposalDTO
from src.agents.travel_agent.tools.ota_scraper import OTAScraperTool
from src.agents.travel_agent.tools.flight_search import FlightSearchTool
from src.agents.travel_agent.tools.research_tool import DestinationResearchTool
from src.core.logic.stratifier import stratify_accommodations
from src.core.settings import settings
from datetime import date, timedelta
import traceback

# 1. Define Agent State
class AgentState(TypedDict):
    messages: List[BaseMessage]
    request: Optional[Union[TravelRequestDTO, dict, str]]
    research_data: str
    flights: List[FlightDTO]
    accommodations: List[AccommodationDTO]
    proposal: Optional[TravelProposalDTO]
    error: str
    status: str # "clarification_needed", "processing", "completed", "failed"
    clarification_message: str

# 2. Define Nodes
async def planner_node(state: AgentState):
    """Analiza la entrada del usuario y verifica si falta información crítica."""
    last_message = state["messages"][-1].content
    
    try:
        llm = ChatGroq(
            model=settings.LLM_MODEL, 
            groq_api_key=settings.GROQ_API_KEY,
            temperature=0
        )
        
        # 1. Intentamos extraer los datos estructurados
        # Usamos un prompt que enfatice la detección de falta de datos
        extraction_prompt = (
            "Extrae los detalles del viaje del siguiente mensaje: {input}\n"
            "Si faltan el destino, las fechas (ida/vuelta) o el número de personas, "
            "marca esos campos como nulos o vacíos. No te inventes fechas."
        ).format(input=last_message)
        
        try:
            structured_llm = llm.with_structured_output(TravelRequestDTO)
            travel_req = await structured_llm.ainvoke(extraction_prompt)
        except Exception as se:
            print(f"DEBUG: Structured output failed in planner: {se}")
            travel_req = None

        # 2. Verificamos si la información es suficiente
        # Si no hay destino o no hay fechas claras, pedimos aclaración
        missing_fields = []
        if not travel_req or not travel_req.destination or travel_req.destination.lower() in ["string", "unknown", ""]:
            missing_fields.append("destino")
        if not travel_req or not travel_req.check_in or not travel_req.check_out:
            missing_fields.append("fechas de viaje")
        if not travel_req or not travel_req.pax_adults:
            missing_fields.append("número de personas")

        if missing_fields:
            # Generamos una pregunta natural para el usuario
            clarification_prompt = (
                f"El usuario dijo: '{last_message}'. "
                f"Faltan los siguientes datos: {', '.join(missing_fields)}. "
                "Genera una respuesta amable y profesional en español pidiendo estos datos específicos "
                "para poder planificar el viaje perfecto. Sé conciso."
            )
            q_res = await llm.ainvoke(clarification_prompt)
            return {
                "status": "clarification_needed",
                "clarification_message": q_res.content,
                "request": travel_req
            }
            
        return {
            "request": travel_req, 
            "status": "processing",
            "clarification_message": "",
            "error": ""
        }
    except Exception as e:
        print(f"Planner error: {e}")
        return {"error": f"Error en la planificación: {str(e)}", "status": "failed"}

async def researcher_node(state: AgentState):
    """Researches logistics and best zones for the destination."""
    tool = DestinationResearchTool()
    req = state["request"]
    if not req: return {"error": "Missing request"}
    
    try:
        # Robust extraction
        if isinstance(req, TravelRequestDTO):
            destination = req.destination
        elif isinstance(req, dict):
            destination = req.get("destination", "Tokio")
        else:
            destination = str(req)
            
        print(f"DEBUG: Researching destination: {destination}")
        content = await tool._run(destination=str(destination))
        return {"research_data": content}
    except Exception as e:
        print(f"Research error: {e}. Trace: {traceback.format_exc()}")
        return {"error": f"Research failed: {str(e)}"}

async def flight_searcher_node(state: AgentState):
    """Parallel flight searcher with DTO validation."""
    tool = FlightSearchTool()
    req = state["request"]
    if not isinstance(req, TravelRequestDTO):
        return {"error": "Missing or invalid travel request for flight search"}
    
    try:
        results = await tool._run(request=req)
        return {"flights": results}
    except Exception as e:
        return {"error": f"Flight sourcing failed: {str(e)}"}

async def hotel_searcher_node(state: AgentState):
    """Parallel hotel searcher with DTO validation."""
    tool = OTAScraperTool()
    req = state["request"]
    if not isinstance(req, TravelRequestDTO):
        return {"error": "Missing or invalid travel request for hotel search"}
    
    try:
        results = await tool._run(request=req)
        return {"accommodations": results}
    except Exception as e:
        return {"error": f"Hotel sourcing failed: {str(e)}"}

async def orchestrator_node(state: AgentState):
    """Synthesizes the final proposal with Expert Logic and Transport Intelligence."""
    llm = ChatGroq(
        model=settings.LLM_MODEL, 
        groq_api_key=settings.GROQ_API_KEY,
        temperature=0.3
    )
    
    accommodations = stratify_accommodations(state.get("accommodations", []))
    flights = state.get("flights", [])
    research_summary = state.get("research_data", "N/A")
    
    # 1. Transport Intelligence: Determine if car or transit is better
    transport_prompt = (
        f"Analiza esta investigación de destino: {research_summary}\n"
        f"Determina la mejor logística de transporte local (Coche de Alquiler vs Transporte Público).\n"
        f"Crea una lista de 1-2 TransportDTO en formato JSON.\n"
        f"Si es un destino de ciudad (ej. Tokio), recomienda Metro/Tren.\n"
        f"Si es un destino de costa o rural (ej. Costa Amalfitana), recomienda Alquiler de Coche.\n"
        f"Devuelve solo el JSON con campos: id, type, provider, description, price, url."
    )
    
    transports = []
    try:
        # We use a structured approach for transports if possible, otherwise fallback
        transport_res = await llm.ainvoke(transport_prompt)
        # Simple extraction logic for demonstration - in production use with_structured_output
        import json
        import re
        json_match = re.search(r"\[.*\]", transport_res.content, re.DOTALL)
        if json_match:
            transport_data = json.loads(json_match.group())
            transports = [TransportDTO(**t) for t in transport_data]
    except Exception as te:
        print(f"Transport logic error: {te}")
        transports = [TransportDTO(
            id="T-001", type="Recomendación Experta", provider="Local Insight",
            description="Se recomienda transporte público/taxis para este itinerario.",
            price=0.0
        )]

    # 2. Expert Itinerary Summary
    summary_prompt = (
        f"Eres un Director de Agencia de Viajes de Lujo. "
        f"Crea una propuesta coherente y profesional. "
        f"Investigación logística: {research_summary}. "
        f"Resume el itinerario experto resaltando por qué elegiste estas opciones de transporte y estancia."
    )
    
    try:
        req = state["request"]
        destination = req.destination if isinstance(req, TravelRequestDTO) else state["request"].get("destination", "Tokio")
            
        proposal_input = {
            "request_id": "ORD-001",
            "destination": destination,
            "flights": flights,
            "accommodations": accommodations,
            "transports": transports,
            "expert_itinerary_summary": "Draft itinerary.",
            "total_estimated_price": 0.0
        }
        
        if flights and accommodations:
            f_price = flights[0].price if hasattr(flights[0], 'price') else 0.0
            a_price = accommodations[0].total_price_estancia if hasattr(accommodations[0], 'total_price_estancia') else 0.0
            t_price = sum(t.price for t in transports)
            proposal_input["total_estimated_price"] = f_price + a_price + t_price
            
        summary = await llm.ainvoke(summary_prompt)
        proposal_input["expert_itinerary_summary"] = summary.content
        
        return {"proposal": TravelProposalDTO(**proposal_input), "accommodations": accommodations}
    except Exception as e:
        print(f"Orchestration error: {e}. Trace: {traceback.format_exc()}")
        return {"error": f"Orchestration failed: {str(e)}"}

# 3. Define Logic
def should_continue(state: AgentState):
    if state.get("status") == "clarification_needed":
        return "clarification"
    if state.get("error"):
        return END
    return "researcher"

# 4. Build Graph
workflow = StateGraph(AgentState)

workflow.add_node("planner", planner_node)
workflow.add_node("researcher", researcher_node)
workflow.add_node("flight_searcher", flight_searcher_node)
workflow.add_node("hotel_searcher", hotel_searcher_node)
workflow.add_node("orchestrator", orchestrator_node)

workflow.add_edge(START, "planner")
workflow.add_conditional_edges(
    "planner",
    should_continue,
    {
        "researcher": "researcher", 
        "clarification": END, 
        END: END
    }
)

workflow.add_edge("researcher", "flight_searcher")
workflow.add_edge("researcher", "hotel_searcher")

workflow.add_edge("flight_searcher", "orchestrator")
workflow.add_edge("hotel_searcher", "orchestrator")

workflow.add_edge("orchestrator", END)

# 5. Compile
compiled_graph = workflow.compile()
