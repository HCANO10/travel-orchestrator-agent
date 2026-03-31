import asyncio
import uuid
import os
from datetime import date
from typing import Dict, Any, Optional

from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from src.agents.travel_agent.graph import compiled_graph
from src.agents.travel_agent.schemas import TravelRequestDTO
from src.core.reporting.pdf_renderer import render_professional_pdf
from langchain_core.messages import HumanMessage

app = FastAPI(title="Travel Orchestrator API", version="3.2")

# Enable CORS for React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for mission states (v3.2 demo)
missions: Dict[str, Dict[str, Any]] = {}

class MissionCreate(BaseModel):
    query: Optional[str] = None # Free text input
    destination: Optional[str] = None
    origin: str = "Madrid"
    pax_adults: Optional[int] = 2
    check_in: Optional[str] = None 
    check_out: Optional[str] = None
    budget: str = "Medio"

async def run_mission_task(mission_id: str, input_text: str, initial_req: Optional[TravelRequestDTO] = None):
    """Background task to execute the LangGraph and generate PDF."""
    missions[mission_id]["status"] = "running"
    missions[mission_id]["nodes_executed"] = []
    
    input_data = {
        "messages": [HumanMessage(content=input_text)],
        "request": initial_req,
        "results": [],
        "flights": [],
        "accommodations": [],
        "proposal": None,
        "error": "",
        "status": "processing",
        "clarification_message": ""
    }
    
    try:
        async for event in compiled_graph.astream(input_data):
            for node_name, output in event.items():
                missions[mission_id]["nodes_executed"].append(node_name)
                missions[mission_id]["current_node"] = node_name
                
                # Capture all relevant fields from the latest node output
                if "proposal" in output:
                    missions[mission_id]["proposal"] = output["proposal"]
                if "status" in output:
                    missions[mission_id]["status"] = output["status"]
                if "clarification_message" in output:
                    missions[mission_id]["clarification_message"] = output["clarification_message"]
                if "error" in output and output["error"]:
                    missions[mission_id]["error"] = output["error"]
                    missions[mission_id]["status"] = "failed"
        
        # Termination conditions
        current_status = missions[mission_id]["status"]
        if current_status == "clarification_needed":
            print(f"Mission {mission_id} paused for clarification.")
            return # Wait for user response
            
        # After graph finishes successfully
        proposal = missions[mission_id].get("proposal")
        if proposal and current_status != "failed":
            pdf_path = f"results/proposal_{mission_id}.pdf"
            os.makedirs("results", exist_ok=True)
            await render_professional_pdf(proposal, pdf_path)
            missions[mission_id]["pdf_url"] = f"/api/v1/mission/{mission_id}/pdf"
            missions[mission_id]["status"] = "completed"
        elif current_status != "clarification_needed":
            missions[mission_id]["status"] = "failed"
            
    except Exception as e:
        missions[mission_id]["status"] = "failed"
        missions[mission_id]["error"] = str(e)
        print(f"Mission {mission_id} failed: {e}")

@app.post("/api/v1/mission")
async def create_mission(data: MissionCreate, background_tasks: BackgroundTasks):
    mission_id = str(uuid.uuid4())
    
    # If partial data is provided, we still try to run the planner
    travel_req = None
    if data.destination:
        try:
            travel_req = TravelRequestDTO(
                destination=data.destination,
                origin=data.origin,
                pax_adults=data.pax_adults,
                check_in=date.fromisoformat(data.check_in) if data.check_in else None,
                check_out=date.fromisoformat(data.check_out) if data.check_out else None,
                budget_preference=data.budget
            )
        except: pass

    input_text = data.query if data.query else f"Quiero viajar a {data.destination} desde {data.origin} del {data.check_in} al {data.check_out} para {data.pax_adults} adultos. Presupuesto {data.budget}."
    
    missions[mission_id] = {
        "id": mission_id,
        "status": "pending",
        "current_node": "start",
        "nodes_executed": [],
        "proposal": None,
        "error": "",
        "clarification_message": "",
        "pdf_url": None
    }
    
    background_tasks.add_task(run_mission_task, mission_id, input_text, travel_req)
    return {"mission_id": mission_id}

@app.post("/api/v1/mission/{mission_id}/message")
async def respond_mission(mission_id: str, message: Dict[str, str], background_tasks: BackgroundTasks):
    if mission_id not in missions:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    user_message = message.get("text", "")
    if not user_message:
        raise HTTPException(status_code=400, detail="Missing message text")
    
    # Reset status and resume
    missions[mission_id]["status"] = "pending"
    background_tasks.add_task(run_mission_task, mission_id, f"Respondiendo a tu pregunta: {user_message}")
    return {"status": "resumed"}

@app.get("/api/v1/mission/{mission_id}")
async def get_mission_status(mission_id: str):
    if mission_id not in missions:
        raise HTTPException(status_code=404, detail="Mission not found")
    return missions[mission_id]

@app.get("/api/v1/mission/{mission_id}/pdf")
async def download_pdf(mission_id: str):
    pdf_path = f"results/proposal_{mission_id}.pdf"
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF not ready yet or mission failed")
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"Propuesta_Viaje_{mission_id}.pdf")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
