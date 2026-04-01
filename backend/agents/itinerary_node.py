import logging
import json
from datetime import date, timedelta
from typing import List, Dict, Any, Optional

from backend.models.dtos import DayPlan, ActivityDTO, AccommodationDTO
from backend.models.mission_state import MissionState
from backend.services.groq_service import groq_service
from backend.services.search_service import search_service
from backend.services.cache_service import cache_service, cache_key

logger = logging.getLogger(__name__)

async def itinerary_node(state: MissionState) -> dict:
    """
    Nodo de generación de itinerario detallado.
    Combina actividades reales, clima y IA para crear un plan de viaje día a día.
    """
    try:
        # 1. Extract from state
        # Acceso robusto a atributos de MissionState
        request = state.travel_request
        if not request:
            raise ValueError("Travel request not found in mission state.")

        # request es un dict (de momento)
        destination = request.destination or "unknown"
        outbound_date = request.outbound_date
        return_date = request.return_date
        travel_style = request.travel_style or "comfort"
        interests = request.interests or []
        num_passengers = request.num_passengers or 1
        
        # outbound_date and return_date are already date objects if coming from DTO
        num_days = 0
        if outbound_date and return_date:
            num_days = (return_date - outbound_date).days
        
        if num_days <= 0:
            num_days = 1

        # 2. Get accommodation address for context
        accommodation_address = f"{destination} city center"
        selected = state.selected_accommodation
        
        if selected:
            # selected is still a dict or None from MissionState.selected_accommodation
            accommodation_address = selected.get("address") or f"{destination} center"
        else:
            comfort_list = state.accommodations_comfort or []
            if comfort_list and len(comfort_list) > 0:
                first_comfort = comfort_list[0]
                # If first_comfort is a dict, use .get(); if it's a DTO, use attribute access.
                # Currently MissionState.accommodations_comfort: List[Dict[str, Any]]
                accommodation_address = first_comfort.get("address") if isinstance(first_comfort, dict) else getattr(first_comfort, "address", None) or f"{destination} center"

        # 3. Fetch activities (with cache)
        act_key = cache_key("activities", destination, ",".join(sorted(interests)))
        act_cached = await cache_service.get(act_key)
        
        activities_list = []
        if act_cached and "activities" in act_cached:
            activities_list = [ActivityDTO(**a) for a in act_cached["activities"]]
            logger.info(f"Activities retrieved from cache for {destination}")
        else:
            activities_list = await search_service.search_activities(destination, interests)
            await cache_service.set(
                act_key, 
                {"activities": [a.model_dump(mode="json") for a in activities_list]}, 
                ttl_seconds=604800
            )

        # Build activities_context string
        activities_context = "\n".join([
            f"- {a.name}: {a.description}" for a in activities_list[:25]
        ])

        # 4. Fetch weather summary (with cache)
        travel_month = outbound_date.month
        weather_key = cache_key("weather", destination, str(travel_month))
        weather_cached = await cache_service.get(weather_key)
        
        weather_summary = ""
        if weather_cached and isinstance(weather_cached, dict) and "weather" in weather_cached:
            weather_summary = weather_cached["weather"]
        elif weather_cached and isinstance(weather_cached, str):
            weather_summary = weather_cached
        
        if not weather_summary:
            weather_summary = await search_service.get_weather_summary(destination, travel_month)
            await cache_service.set(weather_key, {"weather": weather_summary}, ttl_seconds=21600)

        # 5. Generate itinerary via Groq
        itinerary_data = await groq_service.generate_itinerary(
            destination=destination,
            num_days=num_days,
            travel_style=travel_style,
            interests=interests,
            accommodation_address=accommodation_address,
            activities_context=activities_context,
            weather_context=weather_summary
        )

        # 6. Parse itinerary_data into list[DayPlan]
        day_plans = []
        current_date = outbound_date
        
        for i, day_dict in enumerate(itinerary_data):
            day_activities = []
            raw_activities = day_dict.get("activities", [])
            
            for act in raw_activities:
                # Normalize activity type for Pydantic
                raw_type = str(act.get("type", "cultural")).lower()
                valid_types = ["cultural", "nature", "food", "adventure", "relax", "shopping"]
                # Heuristic mapping for common LLM hallucinations
                if "history" in raw_type or "landmark" in raw_type or "museum" in raw_type:
                    norm_type = "cultural"
                elif "park" in raw_type or "hike" in raw_type:
                    norm_type = "nature"
                elif "eat" in raw_type or "dinner" in raw_type or "lunch" in raw_type:
                    norm_type = "food"
                else:
                    norm_type = raw_type if raw_type in valid_types else "cultural"

                # Create ActivityDTO with defaults
                dto = ActivityDTO(
                    name=act.get("name", "Actividad"),
                    type=norm_type,
                    description=act.get("description", ""),
                    location=act.get("location") or act.get("address"),
                    price_eur=float(act.get("price_eur") or 0.0),
                    duration_hours=float(act.get("duration_hours") or 2.0),
                    source="groq",
                    verified=False
                )
                day_activities.append(dto)
            
            plan = DayPlan(
                day_number=i + 1,
                date=current_date,
                title=day_dict.get("title"),
                summary=day_dict.get("summary"),
                weather_summary=day_dict.get("weather_summary"),
                meals=day_dict.get("meals", []),
                transport_notes=day_dict.get("transport_notes"),
                activities=day_activities,
                estimated_cost=sum(a.price_eur or 0.0 for a in day_activities)
            )
            day_plans.append(plan)
            current_date += timedelta(days=1)

        # 7. Calculate total_estimated_budget
        activity_costs = sum(day.estimated_cost for day in day_plans)
        food_estimate = 40.0 * num_days * num_passengers
        total_estimated = activity_costs + food_estimate

        # 8. Return state update
        return {
            "itinerary": [d.model_dump(mode="json") for d in day_plans],
            "total_estimated_budget": total_estimated,
            "nodes_completed": state.nodes_completed + ["itinerary"],
            "status": "done"
        }

    except Exception as e:
        logger.error(f"Itinerary error: {str(e)}")
        return {
            "itinerary": [],
            "nodes_completed": state.nodes_completed + ["itinerary"],
            "status": "done",
            "error_messages": state.error_messages + [f"Itinerary error: {str(e)}"]
        }
