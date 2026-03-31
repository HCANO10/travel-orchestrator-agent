import asyncio
import json
from datetime import date, datetime
from unittest.mock import AsyncMock, patch, MagicMock
from backend.services.search_service import SearchService
from backend.models.dtos import FlightDTO, AccommodationDTO

async def test_search_service():
    service = SearchService()
    
    print("--- Testing URL Generation ---")
    url = service.build_search_url("skyscanner", origin="ZAZ", destination="BCN", date=date(2024, 6, 1))
    print(f"Skyscanner URL: {url}")
    assert "ZAZ/BCN/240601" in url

    print("\n--- Testing Flight Search (Mocking DDG) ---")
    mock_html = """
    <html>
        <body>
            <div class="result__body">
                <a class="result__a">Vuelo Iberia Madrid a Barcelona 89 €</a>
                <p>Oferta Vueling desde 45€ solo hoy.</p>
            </div>
        </body>
    </html>
    """
    
    with patch.object(SearchService, "_fetch_html", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = mock_html
        
        flights = await service.search_flights("MAD", "BCN", date(2024, 6, 1), date(2024, 6, 8))
        
        print(f"Flights found: {len(flights)}")
        # Check if scraped prices are there
        prices = [f.price_per_person for f in flights if f.price_per_person > 0]
        print(f"Scraped prices: {prices}")
        assert 89.0 in prices or 45.0 in prices
        
        # Check if fallbacks are there
        sources = [f.source for f in flights]
        assert "skyscanner" in sources
        assert "google_flights" in sources

    print("\n--- Testing Accommodation Tiers ---")
    with patch.object(SearchService, "_fetch_html", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = "Hotel Palace 350 € por noche. Hostal Paco 40€."
        
        hotels = await service.search_accommodations("Madrid", date(2024, 6, 1), date(2024, 6, 5))
        
        # Verify tiers (scraped hotels should have tiers based on price in DTO validator)
        scraped = [h for h in hotels if h.price_per_night > 0]
        for h in scraped:
            print(f"Hotel: {h.name}, Price: {h.price_per_night}, Tier: {h.tier}")
            if h.price_per_night > 250:
                assert h.tier == "premium"
            elif h.price_per_night < 100:
                assert h.tier == "budget"

    print("\n--- Testing Weather Summary ---")
    with patch.object(SearchService, "_fetch_html", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = "Temperaturas medias de 18-24°C en junio en Madrid."
        weather = await service.get_weather_summary("Madrid", 6)
        print(f"Weather: {weather}")
        assert "18-24°C" in weather

    print("\n--- All tests passed! ---")

if __name__ == "__main__":
    asyncio.run(test_search_service())
