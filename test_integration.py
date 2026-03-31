import asyncio
from datetime import date
from backend.services.groq_service import groq_service
from backend.services.search_service import search_service
from backend.models.dtos import TravelRequestDTO

import os
from dotenv import load_dotenv
load_dotenv()

async def test_integration():
    print("Testing integration...")
    
    # 1. Test Planning
    prompt = "Viaje a Roma en Junio para 2 personas"
    # generate_clarification_questions(destination: str, known_data: dict)
    questions = await groq_service.generate_clarification_questions("Roma", {"prompt": prompt})
    print(f"Generated Questions: {questions}")
    
    # 2. Test Search
    req = TravelRequestDTO(
        origin="MAD",
        destination="ROM",
        outbound_date=date(2026, 6, 1),
        return_date=date(2026, 6, 8),
        num_passengers=2
    )
    
    print("\n--- Searching flights ---")
    flights = await search_service.search_flights(req.origin, req.destination, req.outbound_date, req.return_date)
    print(f"Found {len(flights)} flights")
    if flights:
        print(f"Sample flight: {flights[0].airline} - {flights[0].price_per_person}€")
    
    print("\n--- Searching accommodations ---")
    hotels = await search_service.search_accommodations(req.destination, req.outbound_date, req.return_date)
    print(f"Found {len(hotels)} hotels")
    if hotels:
        print(f"Sample hotel: {hotels[0].name} - {hotels[0].price_per_night}€/night")
    
    # 3. Test Itinerary
    # generate_itinerary(destination, num_days, travel_style, interests, accommodation_address, activities_context, weather_context)
    print("\n--- Generating itinerary ---")
    num_days = (req.return_date - req.outbound_date).days
    acc_address = hotels[0].address if hotels else "Unknown"
    itinerary_days = await groq_service.generate_itinerary(
        destination=req.destination,
        num_days=num_days,
        travel_style="mixed",
        interests=[],
        accommodation_address=acc_address,
        activities_context="Coliseo, Vaticano, Panteón",
        weather_context="Soleado, 25°C"
    )
    print(f"Itinerary generated with {len(itinerary_days)} days")
    if itinerary_days:
        print(f"Day 1: {itinerary_days[0].get('title')}")

if __name__ == "__main__":
    asyncio.run(test_integration())
