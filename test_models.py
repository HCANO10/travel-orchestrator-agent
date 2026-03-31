from backend.models.dtos import FlightDTO, AccommodationDTO, ActivityDTO
from datetime import datetime, timezone
import json

def test_models():
    print("--- Testing FlightDTO ---")
    flight_data = {
        "airline": "Iberia",
        "departure_time": datetime(2026, 6, 1, 10, 0, tzinfo=timezone.utc),
        "arrival_time": datetime(2026, 6, 1, 12, 0, tzinfo=timezone.utc),
        "origin_airport": "MAD",
        "destination_airport": "BCN",
        "price_per_person": 120.5,
        "total_price_pax": 241.0,
        "duration_minutes": 120,
        "source": "skyscanner"
    }
    flight = FlightDTO(**flight_data)
    print(f"Generated Flight ID: {flight.id}")
    assert flight.id is not None
    
    print("\n--- Testing AccommodationDTO ---")
    hotel_data = {
        "name": "Luxury Hotel",
        "accommodation_type": "hotel",
        "address": "Main St 123",
        "price_per_night": 300.0,
        "total_stay_price": 900.0,
        "nights": 3,
        "booking_link": "https://booking.com/123",
        "source": "booking"
    }
    hotel = AccommodationDTO(**hotel_data)
    print(f"Generated Hotel ID: {hotel.id}")
    print(f"Calculated Tier: {hotel.tier}")
    assert hotel.tier == "premium"
    
    print("\n--- Testing ActivityDTO ---")
    activity_data = {
        "name": "Museum Visit",
        "type": "cultural",
        "description": "A nice museum",
        "source": "groq"
    }
    activity = ActivityDTO(**activity_data)
    print(f"Generated Activity ID: {activity.id}")
    assert activity.id is not None
    
    print("\n--- All tests passed! ---")

if __name__ == "__main__":
    test_models()
