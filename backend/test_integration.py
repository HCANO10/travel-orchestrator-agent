import asyncio
import json
import os
from datetime import date, timedelta
from dotenv import load_dotenv

# Asegurar que las variables de entorno están cargadas
load_dotenv()

from backend.models.dtos import TravelRequestDTO
from backend.api.routes import run_graph, missions

async def test_end_to_end():
    print("🚀 Iniciando Test de Integración End-to-End...")
    
    # 1. Crear una solicitud de viaje
    request = TravelRequestDTO(
        origin="ZAZ",
        destination="Roma",
        outbound_date=date.today() + timedelta(days=30),
        return_date=date.today() + timedelta(days=35),
        num_passengers=2,
        max_price_per_night=150.0,
        travel_style="cultural",
        interests=["Historia", "Arte"],
        needs_car_rental=False
    )
    
    # 2. Inicializar misión
    mission_id = "test-mission-zaz-roma"
    missions[mission_id] = {
        "status": "pending",
        "progress": 0,
        "current_node": "planner",
        "travel_request": request,
        "flights": [],
        "accommodations_budget": [],
        "accommodations_comfort": [],
        "accommodations_premium": [],
        "itinerary": [],
        "total_estimated_budget": 0.0,
        "executive_summary": "",
        "needs_clarification": False,
        "clarification_questions": [],
        "error_messages": []
    }
    
    print(f"✅ Misión '{mission_id}' creada localmente.")
    
    # 3. Ejecutar el grafo (con timeout de 90s)
    print("⏳ Ejecutando flujo de agentes (este proceso puede tardar hasta 60s)...")
    try:
        await asyncio.wait_for(run_graph(mission_id, request), timeout=90.0)
    except asyncio.TimeoutError:
        print("❌ ERROR: El test expiró después de 90 segundos.")
        return
    except Exception as e:
        print(f"❌ ERROR durante la ejecución: {str(e)}")
        return

    # 4. Verificar resultados
    final_state = missions[mission_id]
    
    print("\n--- RESULTADOS DEL TEST ---")
    print(f"Estado Final: {final_state['status']}")
    print(f"Vuelos encontrados: {len(final_state['flights'])}")
    print(f"Hoteles encontrados: {len(final_state['accommodations_budget']) + len(final_state['accommodations_comfort']) + len(final_state['accommodations_premium'])}")
    print(f"Días de Itinerario: {len(final_state['itinerary'])}")
    print(f"Resumen Ejecutivo: {final_state['executive_summary'][:100]}...")
    
    if final_state["status"] == "done" and len(final_state["itinerary"]) > 0:
        print("\n✨ TEST EXITOSO: El agente completó el ciclo completo.")
    else:
        print("\n⚠️ TEST INCOMPLETO: El agente no llegó al estado 'done' o no generó itinerario.")
        print(f"Errores reportados: {final_state['error_messages']}")

if __name__ == "__main__":
    asyncio.run(test_end_to_end())
