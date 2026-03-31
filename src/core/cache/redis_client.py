import json
import hashlib
import functools
from typing import Any, List, Optional, Union, Type
import redis.asyncio as redis
from pydantic import BaseModel

from src.core.settings import settings

class RedisCache:
    def __init__(self, redis_url: str):
        try:
            self.client = redis.from_url(redis_url, decode_responses=True)
            self.connected = True
        except Exception:
            self.connected = False

    async def get(self, key: str) -> Optional[str]:
        if not self.connected: return None
        try:
            return await self.client.get(key)
        except Exception:
            return None

    async def setex(self, key: str, ttl: int, value: str):
        if not self.connected: return
        try:
            await self.client.setex(key, ttl, value)
        except Exception:
            pass

    def generate_key(self, prefix: str, request: Any) -> str:
        """Generates a deterministic SHA-256 hash for any input type."""
        if isinstance(request, BaseModel):
            # For Pydantic models, use the model's json representation
            raw_str = request.model_dump_json()
        elif isinstance(request, dict):
            # For dicts, use sorted items for determinism
            raw_str = json.dumps(request, sort_keys=True)
        else:
            # For strings or other types
            raw_str = str(request)
            
        hash_val = hashlib.sha256(raw_str.encode()).hexdigest()
        return f"{prefix}:{hash_val}"

cache_client = RedisCache(settings.REDIS_URL)

def with_cache(ttl: int = 43200, response_schema: Optional[Type[BaseModel]] = None):
    """
    Decorator to cache Tool results.
    :param ttl: Time to live in seconds.
    :param response_schema: If provided, cache hit will attempt to deserialize into this schema 
                            (or a list of these if the cached data is a list).
    """
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(self, *args, **kwargs):
            # Detect primary input for cache key (usually the first arg after 'self' or a specific kwarg)
            primary_input = None
            if args:
                primary_input = args[0]
            elif kwargs:
                primary_input = next(iter(kwargs.values()))

            if primary_input is None:
                return await func(self, *args, **kwargs)

            # Use the tool's name or the function name as prefix
            prefix = getattr(self, 'name', func.__name__)
            key = cache_client.generate_key(prefix, primary_input)
            
            # Cache Hit Check
            cached_data = await cache_client.get(key)
            if cached_data:
                print(f"CACHE HIT: {key}")
                data = json.loads(cached_data)
                
                if response_schema:
                    if isinstance(data, list):
                        return [response_schema(**item) for item in data]
                    return response_schema(**data)
                return data
            
            # Cache Miss
            print(f"CACHE MISS: {key}")
            result = await func(self, *args, **kwargs)
            
            # Serialization and Storage
            if result is not None:
                if isinstance(result, list):
                    serialized = json.dumps([
                        item.model_dump() if hasattr(item, 'model_dump') else item 
                        for item in result
                    ])
                elif hasattr(result, 'model_dump'):
                    serialized = result.model_dump_json()
                else:
                    serialized = json.dumps(result)
                    
                await cache_client.setex(key, ttl, serialized)
                
            return result
        return wrapper
    return decorator
