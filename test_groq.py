import asyncio
import json
import time
from unittest.mock import AsyncMock, MagicMock, patch
from backend.services.groq_service import GroqService

async def test_groq_service():
    # Setup service with mock client
    service = GroqService()
    service.client = MagicMock()
    service.client.chat.completions.create = AsyncMock()

    print("--- Testing JSON Cleaning ---")
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = '```json\n{"status": "ok", "message": "hello world"}\n```'
    service.client.chat.completions.create.return_value = mock_response

    result = await service.generate_json("test prompt")
    print(f"Cleaned JSON: {result}")
    assert result["status"] == "ok"
    assert result["message"] == "hello world"

    print("\n--- Testing Rate Limiting (Mocked Sleep) ---")
    service.max_requests_per_minute = 2 # 2 per min
    service.request_timestamps = []
    
    with patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
        # 1st request - ok
        await service._wait_for_rate_limit()
        # 2nd request - ok
        await service._wait_for_rate_limit()
        
        # 3rd request - should trigger sleep since we're over limit 2
        await service._wait_for_rate_limit()
        
        assert mock_sleep.called
        print(f"Asyncio.sleep called correctly after limit exceeded.")
        assert len(service.request_timestamps) == 3

    print("\n--- Testing Travel Methods (Signatures) ---")
    mock_itinerary_resp = MagicMock()
    mock_itinerary_resp.choices = [MagicMock()]
    mock_itinerary_resp.choices[0].message.content = json.dumps([{"day_number": 1, "title": "Test Day"}])
    service.client.chat.completions.create.return_value = mock_itinerary_resp
    
    itinerary = await service.generate_itinerary("Paris", 1, "relax", ["food"], "Hotel 1", "ctx", "weather")
    print(f"Itinerary structure: {itinerary}")
    assert isinstance(itinerary, list)
    assert itinerary[0]["day_number"] == 1

    print("\n--- All tests passed! ---")

if __name__ == "__main__":
    # Ensure a dummy key is in env for the singleton import test if needed
    import os
    os.environ["GROQ_API_KEY"] = "test_key"
    asyncio.run(test_groq_service())
