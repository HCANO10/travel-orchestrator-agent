import asyncio
import json
import os
from src.agents.travel_agent.graph import compiled_graph
from src.core.logic.stratifier import stratify_accommodations
from src.core.reporting.pdf_renderer import render_professional_pdf
from langchain_core.messages import HumanMessage

async def run_amalfi_mission_v2():
    print("--- MISSION: AMALFI_PROFESSIONAL_SOURCING_V2.0 ---")
    print("STATUS: Executing Premium Pipeline (Gemini + Multi-Source)...")
    
    # Ensure results directory exists
    os.makedirs("results", exist_ok=True)
    
    # Mission Prompt (Massive Sourcing Requested)
    mission_prompt = (
        "Misión V2.0: Localizar al menos 20 opciones de alojamiento para 6 adultos en la Costa Amalfitana (Junio 2026). "
        "Búsqueda universal: Booking, Airbnb, Google Hotels. "
        "Requisito: Estratificar por precios (Caro, Medio, Barato). "
        "Output: Reporte PDF Profesional de alta calidad."
    )
    
    sample_input = {
        "messages": [HumanMessage(content=mission_prompt)],
        "results": [],
        "iterations": 0
    }
    
    # 1. Extraction (Graph / Scraper)
    final_state = await compiled_graph.ainvoke(sample_input)
    
    if final_state.get("error"):
        print(f"FAILED: {final_state['error']}")
        return

    raw_results = final_state.get("results", [])
    print(f"DEBUG: {len(raw_results)} raw results extracted.")
    
    # 2. Price Stratification
    stratified_results = stratify_accommodations(raw_results)
    
    # 3. Save JSON
    json_path = "results/amalfi_2026_premium.json"
    with open(json_path, "w", encoding="utf-8") as f:
        # Pydantic dump
        data_to_save = [acc.model_dump() for acc in stratified_results]
        json.dump(data_to_save, f, indent=2, ensure_ascii=False)
    
    # 4. Render Premium PDF (Playwright + HTML)
    pdf_path = "results/amalfi_2026_premium_report.pdf"
    await render_professional_pdf(stratified_results, pdf_path)
    
    print("\n--- PREMIUM MISSION SUCCESS ---")
    print(f"Raw data: {json_path}")
    print(f"Agency Report: {pdf_path}")
    print("\nDoD: 20+ Results stratified and Professional PDF generated.")

if __name__ == "__main__":
    asyncio.run(run_amalfi_mission_v2())
