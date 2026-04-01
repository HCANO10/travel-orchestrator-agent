"""
Supabase persistence layer para misiones de viaje.

Requiere en .env:
  SUPABASE_URL=https://<proyecto>.supabase.co
  SUPABASE_KEY=<anon-key>

Si las variables no están definidas, el servicio opera en modo deshabilitado
y todas las operaciones son no-ops (no rompe el flujo existente).

Ejecutar la migración SQL en el panel Supabase antes de usar:
  backend/infrastructure/database/migrations/001_create_missions.sql
"""

import os
import json
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class SupabaseService:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL", "")
        self.key = os.getenv("SUPABASE_KEY", "")
        self._client = None
        self._enabled = bool(self.url and self.key)

        if self._enabled:
            try:
                from supabase import create_client
                self._client = create_client(self.url, self.key)
                logger.info("Supabase: cliente inicializado correctamente.")
            except ImportError:
                logger.warning(
                    "Supabase: librería 'supabase' no instalada. "
                    "Ejecuta: pip install supabase. Persistencia deshabilitada."
                )
                self._enabled = False
            except Exception as e:
                logger.error(f"Supabase: error al inicializar cliente: {e}")
                self._enabled = False
        else:
            logger.info("Supabase: SUPABASE_URL/KEY no configurados. Persistencia deshabilitada.")

    @property
    def enabled(self) -> bool:
        return self._enabled

    async def upsert_mission(self, mission_id: str, state: Dict[str, Any]) -> bool:
        """
        Inserta o actualiza el estado completo de una misión en la tabla 'missions'.
        Devuelve True si se guardó correctamente, False en caso contrario.
        """
        if not self._enabled:
            return False
        try:
            # Serializar campos complejos a JSON string para almacenamiento
            payload = {
                "id": mission_id,
                "status": state.get("status", "unknown"),
                "state_json": json.dumps(state, default=str),
                "destination": self._extract_destination(state),
                "nodes_completed": state.get("nodes_completed", []),
                "total_budget": state.get("total_estimated_budget"),
            }
            self._client.table("missions").upsert(payload).execute()
            return True
        except Exception as e:
            logger.error(f"Supabase upsert_mission error: {e}")
            return False

    async def get_mission(self, mission_id: str) -> Optional[Dict[str, Any]]:
        """
        Recupera el estado de una misión por ID.
        Devuelve None si no existe o hay error.
        """
        if not self._enabled:
            return None
        try:
            result = (
                self._client.table("missions")
                .select("state_json")
                .eq("id", mission_id)
                .single()
                .execute()
            )
            if result.data:
                return json.loads(result.data["state_json"])
            return None
        except Exception as e:
            logger.error(f"Supabase get_mission error: {e}")
            return None

    async def list_missions_by_user(self, user_id: str, limit: int = 20) -> list:
        """
        Lista las misiones más recientes de un usuario (por prefijo de ID).
        """
        if not self._enabled:
            return []
        try:
            result = (
                self._client.table("missions")
                .select("id, status, destination, nodes_completed, total_budget")
                .like("id", f"mission_{user_id}_%")
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            return result.data or []
        except Exception as e:
            logger.error(f"Supabase list_missions error: {e}")
            return []

    def _extract_destination(self, state: Dict[str, Any]) -> str:
        req = state.get("travel_request")
        if isinstance(req, dict):
            return req.get("destination", "")
        return getattr(req, "destination", "") if req else ""


# Singleton
supabase_service = SupabaseService()
