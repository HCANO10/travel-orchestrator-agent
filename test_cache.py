import asyncio
import time
from backend.services.cache_service import CacheService, cache_key

async def test_cache():
    cache = CacheService(".cache_test")
    
    print("--- Testing cache_key ---")
    key1 = cache_key("flights", "MAD", "JFK", "2026-06-01")
    key2 = cache_key("flights", "MAD", "JFK", "2026-06-01")
    print(f"Generated Key: {key1}")
    assert key1 == key2
    assert len(key1) == 64 # SHA256 hash length in hex
    
    print("\n--- Testing set and get ---")
    test_data = {"price": 450.0, "airline": "Iberia"}
    await cache.set(key1, test_data, ttl_seconds=2)
    
    cached = await cache.get(key1)
    print(f"Cached data: {cached}")
    assert cached == test_data
    
    print("\n--- Testing expiration ---")
    print("Waiting 3 seconds for cache to expire...")
    await asyncio.sleep(3)
    
    expired = await cache.get(key1)
    print(f"Expired data (should be None): {expired}")
    assert expired is None
    
    print("\n--- Testing clear_expired ---")
    # Set one fresh and one expired
    key_fresh = cache_key("fresh")
    key_old = cache_key("old")
    await cache.set(key_fresh, {"status": "ok"}, 10)
    await cache.set(key_old, {"status": "expire_me"}, -10) # Set to expire immediately
    
    deleted = await cache.clear_expired()
    print(f"Deleted expired entries: {deleted}")
    assert deleted >= 1
    
    # Clean up test directory
    import shutil
    shutil.rmtree(".cache_test")
    print("\n--- All tests passed! ---")

if __name__ == "__main__":
    asyncio.run(test_cache())
