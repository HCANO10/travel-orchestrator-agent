from datetime import datetime, date, timezone
from typing import Optional, Literal, List, Union
from pydantic import BaseModel, Field, model_validator, HttpUrl
import hashlib

def generate_sha256_hash(data: str) -> str:
    """Helper function to generate SHA256 hash."""
    return hashlib.sha256(data.encode()).hexdigest()

class FlightDTO(BaseModel):
    id: Optional[str] = None
    airline: str
    departure_time: datetime
    arrival_time: datetime
    origin_airport: str
    destination_airport: str
    price_per_person: float
    total_price_pax: float
    duration_minutes: int
    stops: int = 0
    baggage_included: bool = True
    booking_link: str = ""
    source: Literal["skyscanner", "kayak", "google_flights", "renfe", "kiwi"]
    searched_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    verified: bool = False

    @model_validator(mode='before')
    @classmethod
    def generate_id_if_missing(cls, data: dict) -> dict:
        if isinstance(data, dict) and not data.get("id"):
            # Ensure required fields exist in data dict
            airline = data.get("airline", "unknown")
            dep_time = data.get("departure_time")
            price = data.get("price_per_person", 0.0)
            
            # Format departure_time if it's a datetime object or string
            timestamp = dep_time.isoformat() if hasattr(dep_time, "isoformat") else str(dep_time)
            
            hash_input = f"{airline}{timestamp}{price}"
            data["id"] = generate_sha256_hash(hash_input)
        return data

class AccommodationDTO(BaseModel):
    id: Optional[str] = None
    name: str
    accommodation_type: Literal["hotel", "apartment", "hostel", "villa"]
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distance_to_center_km: Optional[float] = None
    price_per_night: float
    total_stay_price: float
    nights: int
    rating: Optional[float] = Field(None, ge=0.0, le=10.0)
    num_reviews: Optional[int] = None
    amenities: List[str] = []
    cancellation_policy: Optional[str] = None
    booking_link: str
    source: Literal["booking", "airbnb", "hotels_com", "google_hotels"]
    tier: Literal["budget", "comfort", "premium"] = "budget" # Will be calculated
    searched_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @model_validator(mode='before')
    @classmethod
    def process_accommodation_logic(cls, data: dict) -> dict:
        if isinstance(data, dict):
            # 1. Generate ID if missing
            if not data.get("id"):
                name = data.get("name", "unknown")
                address = data.get("address", "unknown")
                price = data.get("price_per_night", 0.0)
                hash_input = f"{name}{address}{price}"
                data["id"] = generate_sha256_hash(hash_input)
            
            # 2. Calculate Tier based on price_per_night
            price = data.get("price_per_night", 0.0)
            if price < 100:
                data["tier"] = "budget"
            elif price < 250:
                data["tier"] = "comfort"
            else:
                data["tier"] = "premium"
                
        return data

class ActivityDTO(BaseModel):
    id: Optional[str] = None
    name: str
    type: Literal["cultural", "nature", "food", "adventure", "relax", "shopping"]
    description: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    duration_minutes: Optional[int] = None
    duration_hours: Optional[float] = None
    opening_hours: Optional[str] = None
    price_eur: Optional[float] = 0.0
    rating: Optional[float] = None
    location: Optional[str] = None
    source: Literal["google_places", "web_search", "groq"] = "groq"
    verified: bool = False

    @model_validator(mode='before')
    @classmethod
    def generate_id_if_missing(cls, data: dict) -> dict:
        if isinstance(data, dict) and not data.get("id"):
            name = data.get("name", "unknown")
            act_type = data.get("type", "unknown")
            hash_input = f"{name}{act_type}"
            data["id"] = generate_sha256_hash(hash_input)
        return data

class DayPlan(BaseModel):
    day_number: int
    date: date
    title: Optional[str] = None
    summary: Optional[str] = None
    weather_summary: Optional[str] = None
    activities: List[ActivityDTO] = []
    estimated_cost: float = 0.0
    meals: List[str] = []
    transport_notes: Optional[str] = None

class TravelRequestDTO(BaseModel):
    origin: str
    destination: str
    outbound_date: date
    return_date: date
    num_passengers: int = 2
    max_budget_total: Optional[float] = None
    max_price_per_night: Optional[float] = None
    travel_style: Literal["cultural", "relax", "adventure", "gastronomic", "mixed"] = "mixed"
    interests: List[str] = []
    needs_car_rental: bool = False
    accommodation_type_preference: str = "any"
