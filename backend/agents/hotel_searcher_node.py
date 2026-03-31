import logging
from typing import List
from backend.models.dtos import AccommodationDTO
from backend.models.mission_state import MissionState
from backend.services.search_service import search_service
from backend.services.cache_service import cache_service, cache_key

logger = logging.getLogger(__name__)

async def hotel_searcher_node(state: MissionState) -> dict:
    """
    Nodo de búsqueda de hoteles con lógica de caché y estratificación por niveles (Budget, Comfort, Premium).
    """
    try:
        # 1. Extract from state
        request = state.get("travel_request")
        if not request:
            raise ValueError("Travel request not found in mission state.")
            
        destination = request.destination
        checkin = request.outbound_date
        checkout = request.return_date
        max_price = request.max_price_per_night
        num_guests = request.num_passengers

        # 2. Build cache key
        key = cache_key("hotels", destination, str(checkin), str(checkout))

        # 3. Check cache first
        cached = await cache_service.get(key)
        accommodations: List[AccommodationDTO] = []
        
        if cached and "accommodations" in cached:
            accommodations = [AccommodationDTO(**a) for a in cached["accommodations"]]
            logger.info(f"Hotel results retrieved from cache for {destination}")
        else:
            # 4. Call search service
            accommodations = await search_service.search_accommodations(
                destination=destination,
                checkin=checkin,
                checkout=checkout,
                max_price_per_night=max_price,
                num_guests=num_guests
            )

            # 5. Store in cache
            if accommodations:
                await cache_service.set(
                    key,
                    {"accommodations": [a.model_dump(mode="json") for a in accommodations]},
                    ttl_seconds=86400
                )

        # 6. Stratify results into three tiers
        # Calculate reference price
        priced_accommodations = [a for a in accommodations if a.price_per_night > 0]
        
        if max_price is not None:
            reference = max_price
        elif priced_accommodations:
            # Median of prices
            sorted_prices = sorted([a.price_per_night for a in priced_accommodations])
            mid = len(sorted_prices) // 2
            if len(sorted_prices) % 2 == 0:
                reference = (sorted_prices[mid - 1] + sorted_prices[mid]) / 2
            else:
                reference = sorted_prices[mid]
        else:
            reference = 150.0 # default fallback

        # Initial stratification
        budget = [a for a in accommodations if 0.0 < a.price_per_night <= reference * 0.6]
        comfort = [a for a in accommodations if reference * 0.6 < a.price_per_night <= reference * 0.85]
        premium = [a for a in accommodations if a.price_per_night > reference * 0.85]
        unpriced = [a for a in accommodations if a.price_per_night == 0.0]

        # Distribute unpriced across tiers round-robin
        for i, acc in enumerate(unpriced):
            tier_idx = i % 3
            if tier_idx == 0:
                budget.append(acc)
            elif tier_idx == 1:
                comfort.append(acc)
            else:
                premium.append(acc)

        # Log results
        logger.info(f"Hotels found for {destination}: {len(budget)} budget, {len(comfort)} comfort, {len(premium)} premium")

        # 8. Return state update
        current_completed = state.get("nodes_completed", [])
        return {
            "accommodations_budget": budget,
            "accommodations_comfort": comfort,
            "accommodations_premium": premium,
            "nodes_completed": current_completed + ["hotel_searcher"],
            "status": "itinerary"
        }

    except Exception as e:
        logger.error(f"Error in hotel_searcher_node: {str(e)}")
        current_completed = state.get("nodes_completed", [])
        current_errors = state.get("error_messages", [])
        return {
            "error_messages": current_errors + [str(e)],
            "nodes_completed": current_completed + ["hotel_searcher"]
        }
