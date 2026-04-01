from abc import ABC, abstractmethod
from typing import List, Dict, Any

class ILLMProvider(ABC):
    """Puerto abstracto para proveedores de LLM (Dependency Inversion)."""
    @abstractmethod
    async def generate_response(self, messages: List[Dict[str, str]], **kwargs) -> str:
        pass
