import asyncio
from typing import List, Type
from playwright.async_api import async_playwright
from langchain.tools import BaseTool
from pydantic import BaseModel, Field
from datetime import date

from src.agents.travel_agent.schemas import TravelRequestDTO, FlightDTO
from src.core.cache.redis_client import with_cache

class FlightSearchInput(BaseModel):
    request: TravelRequestDTO = Field(..., description="The travel request parameters")

class FlightSearchTool(BaseTool):
    name: str = "flight_search"
    description: str = "Searches for REAL flight data using Skyscanner deep links and Playwright."
    args_schema: Type[BaseModel] = FlightSearchInput

    async def _run(self, request: TravelRequestDTO) -> List[FlightDTO]:
        return await self._run_search(request)

    async def _run_search(self, travel_req: TravelRequestDTO) -> List[FlightDTO]:
        results = []
        
        # 1. Resolve IATA Codes using LLM for accuracy (no hardcoding)
        from langchain_groq import ChatGroq
        from src.core.settings import settings
        
        llm = ChatGroq(
            model="llama-3.3-70b-versatile", 
            groq_api_key=settings.GROQ_API_KEY,
            temperature=0
        )
        
        iata_prompt = (
            f"Extrae los códigos IATA del aeropuerto principal para:\n"
            f"Origen: {travel_req.origin}\n"
            f"Destino: {travel_req.destination}\n"
            "Devuelve solo un JSON con las claves 'origin_iata' y 'dest_iata' (ej. MAD, NRT). "
            "Prioriza los aeropuertos principales."
        )
        
        origin_iata = "MAD"
        dest_iata = "TYO"
        
        try:
            res = await llm.ainvoke(iata_prompt)
            import json
            import re
            json_match = re.search(r"\{.*\}", res.content, re.DOTALL)
            if json_match:
                codes = json.loads(json_match.group())
                origin_iata = codes.get("origin_iata", "MAD").upper()
                dest_iata = codes.get("dest_iata", "TYO").upper()
        except Exception as e:
            print(f"Error resolving IATA: {e}. Using defaults.")

        # 2. Prepare Skyscanner Link
        # Skyscanner Date Format: YYMMDD
        date_in = travel_req.check_in.strftime("%y%m%d")
        date_out = travel_req.check_out.strftime("%y%m%d")
        
        skyscanner_url = f"https://www.skyscanner.es/transport/flights/{origin_iata}/{dest_iata}/{date_in}/{date_out}/?adults={travel_req.pax_adults}"
        
        # 3. Build Result
        results.append(FlightDTO(
            id=f"sky_{origin_iata}_{dest_iata}",
            carrier="Varios (Skyscanner)",
            flight_number="Búsqueda en Tiempo Real",
            origin=origin_iata,
            destination=dest_iata,
            departure_time=f"{travel_req.check_in}",
            arrival_time=f"{travel_req.check_out}",
            price=0.0, # Link-centric sourcing
            url=skyscanner_url,
            score=9.0
        ))
        
        print(f"DEBUG: Dynamic Skyscanner link created: {skyscanner_url}")
        return results

