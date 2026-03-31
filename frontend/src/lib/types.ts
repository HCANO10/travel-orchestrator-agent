export interface FlightDTO {
  id: string;
  airline: string;
  departure_time: string;
  arrival_time: string;
  origin_airport: string;
  destination_airport: string;
  price_per_person: number;
  total_price_pax: number;
  duration_minutes: number;
  booking_link?: string;
  source: string;
  verified: boolean;
}

export interface AccommodationDTO {
  id: string;
  name: string;
  accommodation_type: "hotel" | "apartment" | "resort";
  address: string;
  price_per_night: number;
  total_stay_price: number;
  nights: number;
  booking_link?: string;
  source: string;
  tier: "budget" | "comfort" | "premium";
}

export interface ActivityDTO {
  id: string;
  name: string;
  type: string;
  description: string;
  location?: string;
  price_eur?: number;
  duration_hours?: number;
  source: string;
  verified: boolean;
}

export interface DayPlan {
  day_number: number;
  date: string;
  summary: string;
  activities: ActivityDTO[];
  estimated_cost: number;
}

export interface TravelRequestDTO {
  origin: string;
  destination: string;
  outbound_date: string;
  return_date: string;
  num_passengers: number;
  travel_style: "relaxed" | "active" | "mixed" | "cultural" | "adventure";
  interests: string[];
  max_price_per_night?: number;
  needs_car_rental: boolean;
}

export interface MissionState {
  id: string;
  status: "init" | "planning" | "clarifying" | "searching" | "itinerary" | "done" | "error";
  travel_request: TravelRequestDTO;
  clarification_questions: any[];
  clarifications_answered: boolean;
  research_context: string;
  flights: FlightDTO[];
  accommodations_budget: AccommodationDTO[];
  accommodations_comfort: AccommodationDTO[];
  accommodations_premium: AccommodationDTO[];
  selected_accommodation?: AccommodationDTO;
  itinerary: DayPlan[];
  total_estimated_budget?: number;
  nodes_completed: string[];
  error_messages: string[];
}

export interface TravelProposalSummary {
  mission_id: string;
  destination: string;
  dates: {
    outbound: string;
    return: string;
  };
  flights: FlightDTO[];
  accommodations: {
    budget: AccommodationDTO[];
    comfort: AccommodationDTO[];
    premium: AccommodationDTO[];
  };
  itinerary: DayPlan[];
  total_budget: number;
  executive_summary: string;
  nodes_completed: string[];
  status: string;
}
