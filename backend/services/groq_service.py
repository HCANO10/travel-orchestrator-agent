import os
import asyncio
import json
import re
import time
from typing import List, Dict, Any, Optional
from groq import AsyncGroq, RateLimitError, APIError

class GroqService:
    def __init__(self):
        """
        Inicializa el cliente asíncrono de Groq con Rate Limiting de 25 req/min.
        """
        self.api_key = os.environ.get("GROQ_API_KEY")
        
        # Rate Limiter: 25 req/min
        self.max_requests_per_minute = 25
        self.semaphore = asyncio.Semaphore(self.max_requests_per_minute)
        self.request_timestamps: List[float] = []
        self.model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
        self._init_client()

    def _init_client(self):
        self.api_key = os.environ.get("GROQ_API_KEY")
        if not self.api_key:
            print("WARNING: GROQ_API_KEY not found in environment.")
            self.client = None
        else:
            self.client = AsyncGroq(api_key=self.api_key)

    async def _wait_for_rate_limit(self):
        """
        Implementa un sistema de sliding window para respetar el límite de 25 req/min.
        """
        if not self.client:
            self._init_client()
            if not self.client:
                raise ValueError("GROQ_API_KEY is required but not found in environment.")
        
        async with self.semaphore:
            now = time.time()
            # Limpiar timestamps de hace más de 60 segundos
            self.request_timestamps = [t for t in self.request_timestamps if now - t < 60]
            
            if len(self.request_timestamps) >= self.max_requests_per_minute:
                # Calcular tiempo de espera hasta que el más antiguo salga de la ventana
                wait_time = 60 - (now - self.request_timestamps[0])
                if wait_time > 0:
                    await asyncio.sleep(wait_time)
            
            self.request_timestamps.append(time.time())

    async def _call_with_retry(self, func, *args, **kwargs):
        """
        Maneja reintentos con exponential backoff (1s, 2s, 4s) ante errores 429.
        """
        retries = 3
        backoff = [1, 2, 4]
        
        for i in range(retries + 1):
            try:
                await self._wait_for_rate_limit()
                return await func(*args, **kwargs)
            except RateLimitError as e:
                if i < retries:
                    wait = backoff[i]
                    print(f"Rate limit hit. Retrying in {wait}s ({i+1}/{retries})...")
                    await asyncio.sleep(wait)
                else:
                    raise e
            except APIError as e:
                raise e

    async def generate_text(self, prompt: str, system: str = "", max_tokens: int = 2000) -> str:
        """
        Generación de texto libre.
        """
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        # Usamos una lambda para que _call_with_retry acceda al cliente actualizado
        response = await self._call_with_retry(
            lambda **kwargs: self.client.chat.completions.create(**kwargs),
            model=self.model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=0.7
        )
        return response.choices[0].message.content

    async def generate_json(self, prompt: str, system: str = "", max_tokens: int = 2000):
        """
        Generación de JSON robusto con limpieza de markdown.
        """
        system_base = "Respond ONLY with valid JSON. No markdown, no explanation, no ```json fences."
        full_system = f"{system}\n{system_base}" if system else system_base

        retries = 3
        for i in range(retries):
            text = await self.generate_text(prompt, system=full_system, max_tokens=max_tokens)
            
            # Limpiar bloques markdown si existen
            clean_text = re.sub(r'```json\s*|\s*```', '', text).strip()
            
            try:
                return json.loads(clean_text)
            except json.JSONDecodeError as e:
                if i == retries - 1:
                    print(f"Final JSON Parse Error: {clean_text}")
                    raise ValueError(f"Response is not valid JSON after {retries} retries: {str(e)}")
                await asyncio.sleep(0.5)

    async def generate_clarification_questions(self, destination: str, known_data: dict) -> List[Dict[str, Any]]:
        """
        Genera preguntas inteligentes para perfilar el viaje.
        """
        system = "You are a professional travel agent. Be concise and practical."
        prompt = (
            f"Given destination '{destination}' and known data: {known_data}, "
            "generate 2-3 smart clarification questions to better understand what kind of trip the traveler wants. "
            "Focus ONLY on questions that significantly affect accommodation or itinerary planning. "
            "Do NOT ask about dates, origin, or number of travelers if already in known_data. "
            "Return JSON array: [{\"question\": str, \"field\": str, \"importance\": \"high\"|\"medium\"}]"
        )
        return await self.generate_json(prompt, system=system)

    async def generate_itinerary(
        self,
        destination: str,
        num_days: int,
        travel_style: str,
        interests: List[str],
        accommodation_address: str,
        activities_context: str,
        weather_context: str
    ) -> List[Dict[str, Any]]:
        """
        Genera un itinerario detallado basado en el contexto y mejores prácticas de viaje.
        """
        prompt = (
            f"Create a professional travel itinerary for {num_days} days in {destination}.\n\n"
            f"Context:\n- Travel Style: {travel_style}\n- Interests: {', '.join(interests)}\n"
            f"- Base: {accommodation_address}\n- Weather/Context: {weather_context}\n"
            f"- Sourced Activities: {activities_context}\n\n"
            "Constraints:\n"
            "1. Day 1 must be light to account for arrival fatigue.\n"
            "2. Last day should have morning activities only.\n"
            "3. Max 2h of total transport per day.\n"
            "4. Include 1 high-quality restaurant recommendation per day (meals field).\n"
            "5. Return ONLY a valid JSON array of DayPlan objects.\n\n"
            "Structure per day:\n"
            "{\n  \"day_number\": int,\n  \"date\": \"YYYY-MM-DD\",\n  \"summary\": str,\n"
            "  \"weather_summary\": str,\n  \"activities\": [\n"
            "    {\"time\": \"HH:MM\", \"name\": str, \"type\": \"cultural\"|\"nature\"|\"food\"|\"adventure\"|\"relax\"|\"shopping\", \"description\": str, "
            "\"duration_hours\": float, \"location\": str, \"price_eur\": float}\n"
            "  ],\n  \"meals\": [str],\n  \"transport_notes\": str\n}"
        )
        result = await self.generate_json(prompt)
        # Groq sometimes wraps the array: {"itinerary": [...]} instead of [...]
        if isinstance(result, dict):
            for key in ("itinerary", "days", "plan", "schedule"):
                if key in result and isinstance(result[key], list):
                    return result[key]
            # Single day returned as object
            return [result]
        return result

# Exportar singleton
groq_service = GroqService()
