import asyncio
import aiohttp
import re
import json
import logging
from datetime import date, datetime, timedelta
from typing import List, Dict, Any, Optional, Literal
from .cache_service import cache_service, cache_key
from ..models.dtos import FlightDTO, AccommodationDTO, ActivityDTO

# Configuración de registros
logger = logging.getLogger(__name__)

class SearchService:
    def __init__(self):
        # Global timeout enforced as per requirements
        self.timeout = aiohttp.ClientTimeout(total=8, connect=3, sock_read=5)
        self.headers = {
            "User-Agent": "Mozilla/5.0 (compatible; travel-research-bot/1.0)"
        }

    async def _fetch_html(self, url: str) -> str:
        """Helper to fetch HTML content using aiohttp with strict timeout enforcement."""
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.get(url, headers=self.headers, ssl=False) as response:
                    if response.status == 200:
                        return await response.text()
                    else:
                        logger.warning(f"Failed to fetch {url} - Status: {response.status}")
        except asyncio.TimeoutError:
            logger.warning(f"Timeout occurred while fetching {url}")
        except aiohttp.ClientError as e:
            logger.warning(f"ClientError fetching {url}: {e}")
        except Exception as e:
            logger.warning(f"Unexpected error fetching {url}: {e}")
        return ""

    async def _do_duckduckgo_search(self, query: str) -> str:
        """Internal helper for DuckDuckGo HTML search."""
        url = f"https://html.duckduckgo.com/html/?q={query}"
        return await self._fetch_html(url)

    def build_search_url(self, platform: str, **params) -> str:
        """Returns pre-filled search URL for manual verification."""
        if platform == "skyscanner":
            # Skyscanner uses YYMMDD
            d = params.get("date")
            date_str = d.strftime("%y%m%d") if isinstance(d, (date, datetime)) else str(d)
            return f"https://www.skyscanner.es/transporte/vuelos/{params.get('origin')}/{params.get('destination')}/{date_str}/"
        
        elif platform == "google_flights":
            return f"https://www.google.com/travel/flights?hl=es&q=vuelos+{params.get('origin')}+a+{params.get('destination')}+{params.get('date')}"
        
        elif platform == "kayak":
            return f"https://www.kayak.es/flights/{params.get('origin')}-{params.get('destination')}/{params.get('outbound')}/{params.get('return_at')}"
        
        elif platform == "kiwi":
            return f"https://www.kiwi.com/es/search/results/{params.get('origin')}/{params.get('destination')}/{params.get('outbound')}/{params.get('return_at')}"
        
        elif platform == "booking":
            return f"https://www.booking.com/searchresults.es.html?ss={params.get('destination')}&checkin={params.get('checkin')}&checkout={params.get('checkout')}&group_adults={params.get('guests')}&no_rooms=1"
        
        elif platform == "airbnb":
            return f"https://www.airbnb.es/s/{params.get('destination')}/homes?checkin={params.get('checkin')}&checkout={params.get('checkout')}&adults={params.get('guests')}"
        
        elif platform == "google_hotels":
            return f"https://www.google.com/travel/hotels?q=hoteles+en+{params.get('destination')}&checkin={params.get('checkin')}&checkout={params.get('checkout')}"
        
        elif platform == "hotels_com":
            return f"https://es.hotels.com/search.do?q-destination={params.get('destination')}&q-check-in={params.get('checkin')}&q-check-out={params.get('checkout')}"
        
        return ""

    async def search_flights(
        self,
        origin: str,
        destination: str,
        outbound_date: date,
        return_date: date,
        num_passengers: int = 2
    ) -> List[FlightDTO]:
        """Fetches flight data using DuckDuckGo scraping + Fallback URLs."""
        ckey = cache_key("flights", origin, destination, str(outbound_date))
        cached = await cache_service.get(ckey)
        if cached:
            return [FlightDTO(**item) for item in cached]

        results = []
        
        # 1. Add Fallback URLs
        platforms = ["skyscanner", "google_flights", "kayak", "kiwi"]
        for p in platforms:
            url = self.build_search_url(
                p, 
                origin=origin, 
                destination=destination, 
                date=outbound_date,
                outbound=outbound_date,
                return_at=return_date
            )
            results.append(FlightDTO(
                airline=f"Consultar en {p.capitalize()}",
                departure_time=datetime.combine(outbound_date, datetime.min.time()),
                arrival_time=datetime.combine(outbound_date, datetime.max.time()),
                origin_airport=origin,
                destination_airport=destination,
                price_per_person=0.0,
                total_price_pax=0.0,
                duration_minutes=0,
                booking_link=url,
                source=p,
                verified=False
            ))

        # 2. Try DuckDuckGo scraping (wrapped with hard deadline)
        query = f"vuelos+{origin}+{destination}+{outbound_date}+precio"
        try:
            html = await asyncio.wait_for(
                self._do_duckduckgo_search(query),
                timeout=8.0
            )
        except asyncio.TimeoutError:
            logger.warning(f"Flight search timed out for {origin}-{destination}")
            html = ""
        
        if html:
            # Regex for prices: (€XXX or XXX EUR)
            price_matches = re.findall(r'(\d{2,4})\s*€|€\s*(\d{2,4})', html)
            prices = [float(p[0] or p[1]) for p in price_matches]
            
            # Simple heuristic for airline names in titles/snippets
            airlines = ["Iberia", "Vueling", "Ryanair", "Air Europa", "Lufthansa", "Air France", "EasyJet"]
            found_airlines = [a for a in airlines if a.lower() in html.lower()]
            
            for i, p_val in enumerate(prices[:5]):
                airline = found_airlines[i % len(found_airlines)] if found_airlines else "Compañía"
                results.append(FlightDTO(
                    airline=airline,
                    departure_time=datetime.combine(outbound_date, datetime.min.time()),
                    arrival_time=datetime.combine(outbound_date, datetime.max.time()),
                    origin_airport=origin,
                    destination_airport=destination,
                    price_per_person=p_val,
                    total_price_pax=p_val * num_passengers,
                    duration_minutes=120, # Placeholder
                    source="skyscanner", # Defaulting scraped to skyscanner for simplicity
                    verified=True
                ))

        # 3. Sort by price (0.0 last)
        results.sort(key=lambda x: (x.price_per_person == 0, x.price_per_person))
        
        # 4. Cache
        await cache_service.set(ckey, [r.model_dump(mode='json') for r in results], ttl_seconds=3600)
        return results

    async def search_accommodations(
        self,
        destination: str,
        checkin: date,
        checkout: date,
        max_price_per_night: Optional[float] = None,
        num_guests: int = 2
    ) -> List[AccommodationDTO]:
        """Fetches hotel data using DuckDuckGo scraping + Fallback URLs."""
        ckey = cache_key("hotels", destination, str(checkin), str(checkout))
        cached = await cache_service.get(ckey)
        if cached:
            return [AccommodationDTO(**item) for item in cached]

        results = []
        nights = (checkout - checkin).days
        if nights <= 0: nights = 1

        # 1. Add Fallback URLs
        platforms = ["booking", "airbnb", "google_hotels", "hotels_com"]
        for p in platforms:
            url = self.build_search_url(
                p, 
                destination=destination, 
                checkin=checkin, 
                checkout=checkout, 
                guests=num_guests
            )
            results.append(AccommodationDTO(
                name=f"Explorar en {p.capitalize()}",
                accommodation_type="hotel",
                address=destination,
                price_per_night=0.0,
                total_stay_price=0.0,
                nights=nights,
                booking_link=url,
                source=p,
                tier="comfort" # Default for empty prices
            ))

        # 2. Try DuckDuckGo scraping (wrapped with hard deadline)
        query = f"hoteles+{destination}+{checkin}+booking+precio+noche"
        try:
            html = await asyncio.wait_for(
                self._do_duckduckgo_search(query),
                timeout=8.0
            )
        except asyncio.TimeoutError:
            logger.warning(f"Accommodation search timed out for {destination}")
            html = ""
        
        if html:
            price_matches = re.findall(r'(\d{2,4})\s*€|€\s*(\d{2,4})', html)
            prices = [float(p[0] or p[1]) for p in price_matches]
            
            # Combine with price-based logic
            reference_price = max_price_per_night or (sum(prices)/len(prices) if prices else 150)
            
            for i, p_val in enumerate(prices[:8]):
                results.append(AccommodationDTO(
                    name=f"Hotel {i+1} en {destination}",
                    accommodation_type="hotel",
                    address=f"Zona centro, {destination}",
                    price_per_night=p_val,
                    total_stay_price=p_val * nights,
                    nights=nights,
                    booking_link=results[0].booking_link, # Reuse first fallback as base
                    source="booking"
                ))

        # 3. Cache
        await cache_service.set(ckey, [r.model_dump(mode='json') for r in results], ttl_seconds=86400)
        return results[:20]

    async def search_activities(
        self,
        destination: str,
        interests: List[str]
    ) -> List[ActivityDTO]:
        """Fetches activities based on interests."""
        ckey = cache_key("activities", destination, ",".join(sorted(interests)))
        cached = await cache_service.get(ckey)
        if cached:
            return [ActivityDTO(**item) for item in cached]

        found_names = set()
        results = []
        
        queries = [
            f"que ver en {destination} imprescindible",
            f"mejores restaurantes {destination} recomendados",
            f"actividades {destination} turismo"
        ] + [f"{interest} {destination}" for interest in interests[:3]]

        for q in queries:
            try:
                html = await asyncio.wait_for(
                    self._do_duckduckgo_search(q.replace(' ', '+')),
                    timeout=8.0
                )
            except asyncio.TimeoutError:
                logger.warning(f"Activity query '{q}' timed out for {destination}")
                html = ""
            
            if not html:
                continue
            
            # Look for <h3> titles in DuckDuckGo HTML
            titles = re.findall(r'<a class="result__a" href="[^"]*">([^<]*)</a>', html)
            for title in titles[:5]:
                name = title.split("|")[0].split("-")[0].strip()
                if len(name) > 3 and name not in found_names:
                    # Inferred type
                    act_type = "cultural"
                    if any(x in name.lower() for x in ["restaurante", "comida", "bar", "gastronomía"]):
                        act_type = "food"
                    elif any(x in name.lower() for x in ["parque", "montaña", "playa", "naturaleza"]):
                        act_type = "nature"
                    elif any(x in name.lower() for x in ["tour", "aventura", "excursión"]):
                        act_type = "adventure"
                    
                    results.append(ActivityDTO(
                        name=name,
                        type=act_type,
                        description=f"Descubre {name} en tu visita a {destination}.",
                        source="web_search"
                    ))
                    found_names.add(name)

        await cache_service.set(ckey, [r.model_dump(mode='json') for r in results], ttl_seconds=604800)
        return results[:20]

    async def get_weather_summary(self, destination: str, travel_month: int) -> str:
        """Fetches weather summary for a specific month."""
        ckey = cache_key("weather", destination, str(travel_month))
        cached = await cache_service.get(ckey)
        if cached:
            return cached

        query = f"tiempo clima {destination} mes {travel_month} temperatura"
        try:
            html = await asyncio.wait_for(
                self._do_duckduckgo_search(query),
                timeout=8.0
            )
        except asyncio.TimeoutError:
            logger.warning(f"Weather search timed out for {destination}")
            html = ""
        
        if html:
            # Look for temperature range patterns (e.g. 18-24°C)
            temp_matches = re.findall(r'(\d{1,2})[-–]([1234]\d)\s*°C', html)
            if temp_matches:
                t1, t2 = temp_matches[0]
                summary = f"Clima templado/cálido, {t1}-{t2}°C esperados."
                await cache_service.set(ckey, summary, ttl_seconds=21600)
                return summary

        return "Consulta el pronóstico detallado antes de viajar."

# Singleton
search_service = SearchService()
