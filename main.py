import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load env vars before importing routes that use them
load_dotenv()

from backend.api.routes import router

# Configuración básica de logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("api.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Travel Orchestrator API",
    description="Backend API para el Agente Orquestador de Viajes",
    version="5.0.0"
)

# Configuración de CORS
# En producción, define ALLOWED_ORIGINS en el .env (ej: "https://tudominio.com,https://www.tudominio.com")
# En desarrollo, si no está definido, se permite localhost:5173
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-API-Key"],
)

# Incluir rutas de la API
app.include_router(router)

@app.get("/")
async def root():
    return {
        "message": "Bienvenido a Travel Orchestrator Agent API",
        "docs": "/docs",
        "health": "/api/v1/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
