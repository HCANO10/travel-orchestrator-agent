from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import tiktoken
from backend.models.dtos import TravelRequestDTO

class MissionState(BaseModel):
    mission_id: str
    messages: List[Dict[str, str]] = Field(default_factory=list)
    destinations: List[str] = Field(default_factory=list)

    # Research Results
    hotels: List[Dict[str, Any]] = Field(default_factory=list)
    flights: List[Dict[str, Any]] = Field(default_factory=list)
    accommodations_budget: List[Dict[str, Any]] = Field(default_factory=list)
    accommodations_comfort: List[Dict[str, Any]] = Field(default_factory=list)
    accommodations_premium: List[Dict[str, Any]] = Field(default_factory=list)

    # Final Plan
    itinerary: List[Dict[str, Any]] = Field(default_factory=list)
    total_estimated_budget: float = 0.0
    research_context: str = ""

    # State Management & Metadata
    travel_request: Optional[TravelRequestDTO] = None
    selected_accommodation: Optional[Dict[str, Any]] = None
    clarification_questions: List[Dict[str, Any]] = Field(default_factory=list)
    clarifications_answered: bool = False
    nodes_completed: List[str] = Field(default_factory=list)
    error_messages: List[str] = Field(default_factory=list)
    status: str = "pending"

    def get(self, key: str, default: Any = None) -> Any:
        """Dict-style get() for LangGraph compatibility with older graph code."""
        return getattr(self, key, default)

    def trim_context(self, max_tokens: int = 4000) -> None:
        """Evita desbordamiento de contexto (OOM) manteniendo el System Prompt."""
        try:
            encoding = tiktoken.get_encoding("cl100k_base")
            while len(self.messages) > 2:
                total_tokens = sum(len(encoding.encode(msg.get("content", ""))) for msg in self.messages)
                if total_tokens <= max_tokens:
                    break
                self.messages.pop(1) # Elimina el mensaje más antiguo (post-system prompt)
        except Exception as e:
            # Fallback if tiktoken fails
            if len(self.messages) > 10:
                self.messages = [self.messages[0]] + self.messages[-9:]
