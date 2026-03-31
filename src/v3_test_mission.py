import asyncio
import json
import os
from src.agents.travel_agent.graph import compiled_graph
from src.core.reporting.pdf_renderer import render_professional_pdf
from langchain_core.messages import HumanMessage
from src.agents.travel_agent.schemas import TravelProposalDTO

async def run_v3_mission():
    print("--- MISSION: TRAVEL_ORCHESTRATOR_V3.0 (EXPERT LEVEL) ---")
    print("STATUS: Initializing Autonomous Research & Sourcing...")
    
    # Ensure results directory exists
    os.makedirs("results", exist_ok=True)
    
    # Mission Prompt: Real-world complex request
    mission_prompt = (
        "Quiero organizar un viaje de lujo a Japón (Tokio y Kyoto) para 2 personas en Octubre 2026. "
        "Origen: Madrid (MAD). Presupuesto: 10,000€. "
        "Necesito vuelos reales, hoteles boutique y una propuesta de itinerario experto."
    )
    
    initial_state = {
        "messages": [HumanMessage(content=mission_prompt)],
        "request": None,
        "research_data": "",
        "flights": [],
        "accommodations": [],
        "proposal": None,
        "error": ""
    }
    
    # 1. Execute Graph
    print("Step 1: Running Orchestration Graph (Planning -> Research -> Sourcing -> Synthesis)...")
    final_state = await compiled_graph.ainvoke(initial_state)
    
    if final_state.get("error"):
        print(f"FAILED: {final_state['error']}")
        return

    proposal = final_state.get("proposal")
    if not proposal:
        print("FAILED: No proposal generated.")
        return
        
    print(f"DEBUG: Proposal for {proposal.destination} generated successfully.")
    print(f"DEBUG: {len(proposal.flights)} flights and {len(proposal.accommodations)} hotels found.")
    
    # 2. Save JSON Proposal
    json_path = f"results/proposal_{proposal.destination.lower().replace(' ', '_')}_v3.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(proposal.model_dump(), f, indent=2, ensure_ascii=False)
    
    # 3. Render Premium PDF
    pdf_path = f"results/itinerary_{proposal.destination.lower().replace(' ', '_')}_v3.pdf"
    print(f"Step 3: Rendering High-Fidelity PDF Report: {pdf_path}")
    await render_professional_pdf(proposal, pdf_path)
    
    print("\n--- V3 MISSION SUCCESS ---")
    print(f"Propuesta Técnica: {json_path}")
    print(f"Reporte Agencia: {pdf_path}")
    print("\nDoD: Real-time data gathered, synthesized and professional PDF delivered.")

if __name__ == "__main__":
    asyncio.run(run_v3_mission())
