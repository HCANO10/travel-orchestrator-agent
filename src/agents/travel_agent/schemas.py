from pydantic import BaseModel, Field, field_validator
from datetime import date
from typing import Optional, List

class TravelRequestDTO(BaseModel):
    destination: Optional[str] = Field(None, description="The travel destination")
    origin: str = Field("Madrid", description="The origin city/airport")
    pax_adults: Optional[int] = Field(None, gt=0, description="Number of adult passengers")
    check_in: Optional[date] = Field(None, description="Arrival date")
    check_out: Optional[date] = Field(None, description="Departure date")
    budget_preference: str = Field("Medio", description="Budget level: Barato, Medio, Caro")
    transport_preference: Optional[str] = Field(None, description="Coche de alquiler, Transporte público, etc.")
    search_radius_km: int = Field(50, description="Radio de búsqueda en km")

    @field_validator("check_out")
    @classmethod
    def validate_dates(cls, v: Optional[date], info):
        if v and "check_in" in info.data and info.data["check_in"] and v <= info.data["check_in"]:
            raise ValueError("check_out must be after check_in")
        return v

class FlightDTO(BaseModel):
    id: str = Field(..., description="Flight unique ID")
    carrier: str = Field(..., description="Airline name")
    flight_number: str = Field(..., description="Flight number")
    origin: str = Field(..., description="Origin airport IATA or name")
    destination: str = Field(..., description="Destination airport IATA or name")
    departure_time: str = Field(..., description="Departure date and time")
    arrival_time: str = Field(..., description="Arrival date and time")
    price: float = Field(..., description="Price in EUR")
    url: str = Field(..., description="Link to book")
    score: float = Field(..., description="Value score 0-10")

class TransportDTO(BaseModel):
    id: str = Field(..., description="Transport unique ID")
    type: str = Field(..., description="Type of transport: Transfer, Ferry, Train, Rental")
    provider: str = Field(..., description="Company name")
    description: str = Field(..., description="Brief details")
    price: float = Field(..., description="Price in EUR")
    url: Optional[str] = Field(None, description="Booking URL")

class AccommodationDTO(BaseModel):
    id: str = Field(..., description="Accommodation unique ID")
    name: str = Field(..., description="Accommodation name")
    url: str = Field(..., description="URL of the accommodation")
    source: str = Field("Booking.com", description="Sourcing platform")
    price_category: Optional[str] = Field(None, description="Caro, Medio, or Barato")
    total_price_estancia: float = Field(..., description="Total price for the entire stay in EUR")
    pax_capacity: int = Field(6, description="Capacity")
    distance_to_transport: float = Field(..., description="Distance to Ferry/Train hub in meters")
    rating: float = Field(..., ge=0, le=5, description="Average rating")
    review_count: int = Field(..., description="Number of reviews")
    is_apartment_or_villa: bool = Field(True, description="True if it is an apartment/villa")
    altitude_m: Optional[float] = Field(None, description="Altitude in meters")

class TravelProposalDTO(BaseModel):
    request_id: str
    destination: str
    flights: List[FlightDTO] = []
    accommodations: List[AccommodationDTO] = []
    transports: List[TransportDTO] = []
    expert_itinerary_summary: str = Field(..., description="Expert logic synthesis of the trip")
    total_estimated_price: float = 0.0
