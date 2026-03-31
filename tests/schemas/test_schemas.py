import pytest
from datetime import date, timedelta
from pydantic import ValidationError
from src.agents.travel_agent.schemas import TravelRequestDTO

def test_travel_request_valid():
    """Test valid TravelRequestDTO."""
    request = TravelRequestDTO(
        destination="Rome",
        pax_adults=2,
        check_in=date.today(),
        check_out=date.today() + timedelta(days=5)
    )
    assert request.destination == "Rome"
    assert request.pax_adults == 2

def test_travel_request_invalid_pax():
    """Test invalid adults count."""
    with pytest.raises(ValidationError):
        TravelRequestDTO(
            destination="Paris",
            pax_adults=0,
            check_in=date.today(),
            check_out=date.today() + timedelta(days=1)
        )

def test_travel_request_invalid_dates():
    """Test check_out before check_in."""
    with pytest.raises(ValidationError, match="check_out must be after check_in"):
        TravelRequestDTO(
            destination="Madrid",
            pax_adults=1,
            check_in=date.today() + timedelta(days=5),
            check_out=date.today() + timedelta(days=2)
        )
