import os
from typing import List, Dict, Any
from groq import AsyncGroq
from backend.domain.ports.illm_provider import ILLMProvider

class GroqAdapter(ILLMProvider):
    def __init__(self):
        # La API Key debe leerse del entorno de forma segura
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is not set")
        self.client = AsyncGroq(api_key=api_key)
        self.default_model = "llama3-8b-8192"

    async def generate_response(self, messages: List[Dict[str, str]], **kwargs) -> str:
        model = kwargs.get("model", self.default_model)
        try:
            response = await self.client.chat.completions.create(
                messages=messages,
                model=model,
                temperature=kwargs.get("temperature", 0.0)
            )
            return response.choices[0].message.content
        except Exception as e:
            raise RuntimeError(f"Error en GroqAdapter: {str(e)}")
