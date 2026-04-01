import pytest
from backend.models.mission_state import MissionState

def test_mission_state_initialization():
    """Verifica que el estado se inicialice correctamente como BaseModel."""
    state = MissionState(
        mission_id="test_001",
        messages=[{"role": "system", "content": "Eres un asistente de viajes."}]
    )
    assert state.mission_id == "test_001"
    assert len(state.messages) == 1
    assert state.destinations == []

def test_mission_state_trim_context():
    """Verifica que el truncamiento de contexto funcione protegiendo el System Prompt."""
    # Simulamos un historial largo
    state = MissionState(
        mission_id="test_002",
        messages=[
            {"role": "system", "content": "System prompt inmutable."},
            {"role": "user", "content": "Mensaje antiguo 1 que será eliminado."},
            {"role": "assistant", "content": "Respuesta antigua 1 que será eliminada."},
            {"role": "user", "content": "Mensaje reciente."}
        ]
    )

    # Forzamos un límite de tokens muy bajo (ej. 20 tokens) para gatillar el recorte
    # Nota: "System prompt inmutable." + "Mensaje reciente." = ~10 tokens.
    state.trim_context(max_tokens=20)

    # El sistema debe haber eliminado los mensajes del medio
    assert len(state.messages) < 4

    # La regla de oro: El índice 0 SIEMPRE debe ser el system prompt
    assert state.messages[0]["role"] == "system"
    assert state.messages[-1]["content"] == "Mensaje reciente."
