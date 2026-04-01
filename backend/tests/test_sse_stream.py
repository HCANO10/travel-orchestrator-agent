# backend/tests/test_sse_stream.py (Cliente de Prueba SSE para Validar Fase 5)
import asyncio
import json
import logging
import httpx
import pytest

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

async def run_mission_stream_test(mission_id: str):
    """
    Prueba de Integración: Valida que el endpoint SSE emita eventos correctamente
    sin buffering y con la estructura JSON esperada.
    """
    # Usamos test_qa_user_999 para filtrar ruido de analíticas
    url = f"http://localhost:8000/api/v1/travel/stream/{mission_id}"
    
    # Usamos httpx con un timeout elevado para soportar la conexión persistente
    async with httpx.AsyncClient(timeout=httpx.Timeout(60.0)) as client:
        try:
            logger.info(f"Conectando al stream SSE: {url}")
            async with client.stream("GET", url) as response:
                if response.status_code != 200:
                    logger.error(f"Fallo de conexión: HTTP {response.status_code}")
                    return False

                # Iterar sobre las líneas del stream (Server-Sent Events)
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        # Extraer el payload JSON eliminando el prefijo "data: "
                        raw_data = line.replace("data: ", "").strip()
                        if raw_data:
                            payload = json.loads(raw_data)
                            logger.info(f"Evento recibido | Nodos: {payload.get('nodes_completed')} | Estado: {payload.get('status')}")
                            
                            # Condición de salida exitosa
                            if payload.get("status") in ["done", "error", "clarifying"]:
                                logger.info("Stream finalizado por el servidor correctamente.")
                                return True
        except httpx.ReadTimeout:
            logger.error("Timeout crítico: El servidor no envió eventos a tiempo (posible Proxy Buffering).")
            return False
        except Exception as e:
            logger.error(f"Error inesperado durante el stream: {str(e)}")
            return False
    return False

@pytest.mark.asyncio
async def test_sse_endpoint():
    """
    Test que dispara una misión real y monitorea su stream.
    Nota: Requiere que el backend esté corriendo en localhost:8000.
    """
    # 1. Crear una misión de prueba
    async with httpx.AsyncClient() as client:
        resp = await client.post("http://localhost:8000/api/v1/travel/plan", json={
            "user_id": "test_qa_user_999",
            "prompt": "Busca un viaje de 3 días a Tokio desde Madrid en mayo de 2026."
        })
        assert resp.status_code == 200
        mission_id = resp.json().get("mission_id")
        assert mission_id is not None
        
        # 2. Validar el stream
        success = await run_mission_stream_test(mission_id)
        assert success is True

if __name__ == "__main__":
    # Para ejecución manual fuera de pytest
    import sys
    if len(sys.argv) > 1:
        asyncio.run(run_mission_stream_test(sys.argv[1]))
    else:
        print("Uso: python test_sse_stream.py <mission_id>")
