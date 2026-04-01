import os
import json
import hashlib
import time
from pathlib import Path
from typing import Optional, Dict, Any, List
from cachetools import LRUCache

def cache_key(*args) -> str:
    """
    Genera una clave de caché única y segura para nombres de archivo.
    Concatena los argumentos con ':' y los hashea con SHA256.
    """
    key_base = ":".join(str(arg) for arg in args)
    return hashlib.sha256(key_base.encode()).hexdigest()

class CacheService:
    def __init__(self, cache_dir: str = ".cache"):
        """
        Inicializa el servicio de caché de archivos.
        El directorio base es '.cache/' en la raíz del proyecto por defecto.
        """
        self.cache_dir = Path(cache_dir)
        self._ensure_cache_dir()
        # LRU con máximo 500 misiones en memoria. Evita crecimiento infinito.
        self._mission_cache: LRUCache = LRUCache(maxsize=500)

    def _ensure_cache_dir(self):
        """Crea el directorio de caché si no existe."""
        if not self.cache_dir.exists():
            self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _get_file_path(self, key: str) -> Path:
        """Devuelve la ruta del archivo para una clave dada."""
        return self.cache_dir / f"{key}.json"

    async def get(self, key: str) -> Optional[Dict[str, Any]]:
        """
        Recupera datos de la caché. 
        Devuelve None si no existe, el archivo está corrupto o ha expirado.
        """
        file_path = self._get_file_path(key)
        
        if not file_path.exists():
            return None
        
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                entry = json.load(f)
            
            # Verificar expiración
            expires_at = entry.get("expires_at", 0)
            if time.time() > expires_at:
                await self.invalidate(key) # Limpieza proactiva
                return None
            
            return entry.get("data")
        except (json.JSONDecodeError, IOError, KeyError):
            return None

    async def set(self, key: str, data: Dict[str, Any], ttl_seconds: int) -> None:
        """
        Guarda datos en la caché con un tiempo de vida (TTL).
        """
        file_path = self._get_file_path(key)
        expires_at = time.time() + ttl_seconds
        
        entry = {
            "data": data,
            "expires_at": expires_at,
            "created_at": time.time()
        }
        
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(entry, f, ensure_ascii=False, indent=2)
        except IOError as e:
            print(f"Cache Write Error: {e}")

    async def invalidate(self, key: str) -> None:
        """Elimina una entrada de la caché."""
        file_path = self._get_file_path(key)
        if file_path.exists():
            try:
                file_path.unlink()
            except IOError:
                pass

    async def clear_expired(self) -> int:
        """
        Escanea el directorio de caché y elimina todas las entradas expiradas.
        Devuelve la cantidad de archivos eliminados.
        """
        deleted_count = 0
        now = time.time()
        
        for file_path in self.cache_dir.glob("*.json"):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    entry = json.load(f)
                
                if now > entry.get("expires_at", 0):
                    file_path.unlink()
                    deleted_count += 1
            except (json.JSONDecodeError, IOError, KeyError):
                # Si el archivo está corrupto, también lo eliminamos
                file_path.unlink()
                deleted_count += 1

        return deleted_count

    async def update_mission_status(self, mission_id: str, state_update: Dict[str, Any]) -> None:
        """
        Actualiza el estado completo de la misión en memoria (para SSE y GET endpoints).
        Hace un merge profundo: nodes_completed acumula, el resto sobreescribe.
        Cuando la misión finaliza (status=done), persiste en Supabase si está configurado.
        """
        if mission_id not in self._mission_cache:
            self._mission_cache[mission_id] = {
                "nodes_completed": [],
                "status": "init",
                "last_update": time.time()
            }

        current = self._mission_cache[mission_id]

        for key, value in state_update.items():
            if key == "nodes_completed":
                existing = current.get("nodes_completed", [])
                if isinstance(value, list):
                    current["nodes_completed"] = list(dict.fromkeys(existing + value))
            elif key == "error_messages":
                existing = current.get("error_messages", [])
                if isinstance(value, list):
                    current["error_messages"] = existing + value
            else:
                current[key] = value

        current["last_update"] = time.time()
        self._mission_cache[mission_id] = current

        # Persist to Supabase when mission reaches a terminal state
        if current.get("status") in ("done", "error"):
            try:
                from backend.infrastructure.database.supabase_service import supabase_service
                if supabase_service.enabled:
                    import asyncio
                    asyncio.create_task(supabase_service.upsert_mission(mission_id, dict(current)))
            except Exception:
                pass  # Never block the pipeline due to persistence errors

    async def get_mission_status(self, mission_id: str) -> Optional[Dict[str, Any]]:
        """Recupera el estado de misión desde la caché de memoria."""
        return self._mission_cache.get(mission_id)

# Constantes de TTL sugeridas por el usuario
CACHE_TTL = {
    "flights": 3600,      # 1 hora
    "hotels": 86400,     # 24 horas
    "activities": 604800, # 7 días
    "weather": 21600     # 6 horas
}

# Singleton export
cache_service = CacheService()
