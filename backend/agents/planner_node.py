import logging
import re
from typing import Dict, Any
from backend.models.dtos import TravelRequestDTO
from backend.models.mission_state import MissionState
from backend.services.groq_service import groq_service

logger = logging.getLogger(__name__)


def _parse_message_fallback(message: str) -> dict | None:
    """
    Parse the structured travel message the frontend always sends.
    Format: "Planifica un viaje desde {origin} a {destination} del {outbound_date}
             al {return_date} para {num_passengers} personas. Estilo: {style}. Intereses: {interests}."
    """
    pattern = r"desde (.+?) a (.+?) del (\d{4}-\d{2}-\d{2}) al (\d{4}-\d{2}-\d{2}) para (\d+) persona"
    m = re.search(pattern, message)
    if not m:
        return None

    origin, destination, outbound, return_d, num_pax = m.groups()

    style_m = re.search(r"Estilo:\s*(\w+)", message)
    travel_style = style_m.group(1).lower() if style_m else "mixed"
    if travel_style not in ["cultural", "relax", "adventure", "gastronomic", "mixed"]:
        travel_style = "mixed"

    interests_m = re.search(r"Intereses:\s*(.+?)\.?\s*$", message)
    interests = (
        [i.strip() for i in interests_m.group(1).split(",") if i.strip()]
        if interests_m else []
    )

    return {
        "origin": origin.strip(),
        "destination": destination.strip(),
        "outbound_date": outbound,
        "return_date": return_d,
        "num_passengers": int(num_pax),
        "travel_style": travel_style,
        "interests": interests,
        "needs_car_rental": False,
    }


async def planner_node(state: MissionState) -> Dict[str, Any]:
    """
    Extrae el TravelRequestDTO del mensaje del usuario.
    Estrategia de 2 capas:
      1. Regex rápido sobre el mensaje estructurado del frontend (siempre funciona)
      2. LLM Groq como refuerzo / fallback
    """
    messages = state.messages or []
    if not messages:
        return {
            "status": "error",
            "error_messages": state.error_messages + ["No user message found"],
            "nodes_completed": state.nodes_completed + ["planner"],
        }

    last_user_message = messages[-1].get("content", "")
    travel_req: TravelRequestDTO | None = None

    # ── 1. Regex parse (fast, zero API calls) ─────────────────────────────────
    try:
        parsed = _parse_message_fallback(last_user_message)
        if parsed:
            travel_req = TravelRequestDTO(**parsed)
            logger.info(f"Planner: regex parse OK → {travel_req.destination}")
    except Exception as e:
        logger.warning(f"Planner regex parse error: {e}")

    # ── 2. Groq LLM extraction (richer, but may fail) ──────────────────────────
    if not travel_req:
        try:
            system_msg = (
                "Eres un experto extractor de datos de viajes. Responde SOLO con JSON válido. "
                "Campos requeridos: origin (str), destination (str), outbound_date (YYYY-MM-DD), "
                "return_date (YYYY-MM-DD), num_passengers (int). "
                "Campos opcionales: travel_style (cultural|relax|adventure|gastronomic|mixed), "
                "interests (list[str])."
            )
            req_data = await groq_service.generate_json(
                prompt=f"Extrae los datos de viaje de este mensaje: {last_user_message}",
                system=system_msg,
            )
            req_data.setdefault("needs_car_rental", False)
            req_data.setdefault("interests", [])
            req_data.setdefault("travel_style", "mixed")
            travel_req = TravelRequestDTO(**req_data)
            logger.info(f"Planner: Groq parse OK → {travel_req.destination}")
        except Exception as e:
            logger.error(f"Planner Groq extraction error: {e}")

    # ── 3. Both failed ──────────────────────────────────────────────────────────
    if not travel_req:
        return {
            "status": "error",
            "error_messages": state.error_messages + [
                "No se pudieron extraer los detalles del viaje del mensaje."
            ],
            "nodes_completed": state.nodes_completed + ["planner"],
        }

    # ── 4. Check for missing critical data ─────────────────────────────────────
    missing = []
    if not travel_req.destination or travel_req.destination.lower() in ["unknown", ""]:
        missing.append("destino")
    if not travel_req.outbound_date or not travel_req.return_date:
        missing.append("fechas de viaje")

    if missing:
        try:
            known = travel_req.model_dump(exclude_none=True, mode="json")
            dest = travel_req.destination or "TBD"
            questions = await groq_service.generate_clarification_questions(
                dest, {"input": last_user_message, "known": known}
            )
        except Exception as e:
            logger.warning(f"Could not generate clarification questions: {e}")
            questions = [
                {"question": f"Por favor indica: {', '.join(missing)}", "field": "info", "importance": "high"}
            ]

        return {
            "travel_request": travel_req,
            "status": "clarifying",
            "clarification_questions": questions,
            "nodes_completed": state.nodes_completed + ["planner"],
        }

    return {
        "travel_request": travel_req,
        "status": "searching",
        "nodes_completed": state.nodes_completed + ["planner"],
    }
