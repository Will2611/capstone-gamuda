from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_ollama import ChatOllama
from src.llm.tools.restaurant_tool import make_restaurant_search_tool
from src.llm.chains.intent_chain import extract_intent
from src.llm.chains.answer_chain import generate_answer
from langchain_core.messages.base import BaseMessage
from src.llm.schemas import RestaurantResult
import proximityhash
import math
import asyncio
from concurrent.futures import ThreadPoolExecutor
from sqlalchemy import func
from datetime import datetime
from src.database.models.restaurants import RestaurantModel
from src.services.external_search import search_external_restaurants

from . import config

# Thread pool for running synchronous external API calls concurrently
_executor = ThreadPoolExecutor(max_workers=5)

SYSTEM_PROMPT = """You are BiteScouts AI, a friendly dining discovery assistant in Kuala Lumpur.
Help users choose restaurants based on cuisine, mood, budget, dietary needs (halal, vegetarian), and distance.
Keep replies concise (2-4 sentences). Suggest specific restaurant types or areas when possible."""


def get_llm():
    if config.LLM_PROVIDER == "gemini":
        if not config.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is required when LLM_PROVIDER=gemini")
        return ChatGoogleGenerativeAI(
            model=config.GEMINI_MODEL,
            google_api_key=config.GEMINI_API_KEY,
            temperature=0
        )
    return ChatOllama(
        model=config.OLLAMA_MODEL,
        base_url=config.OLLAMA_BASE_URL,
        temperature=0
    )


def _to_langchain_messages(messages: list[dict]) -> list:
    lc_messages:list[BaseMessage] = [SystemMessage(content=SYSTEM_PROMPT)]
    for msg in messages:
        if msg["role"] == "assistant":
            lc_messages.append(AIMessage(content=msg["content"]))
        else:
            lc_messages.append(HumanMessage(content=msg["content"]))
    return lc_messages


async def chat(messages: list[dict]) -> str:
    trimmed = messages[-config.MAX_HISTORY_TURNS :]
    llm = get_llm()
    response = await llm.ainvoke(_to_langchain_messages(trimmed))
    content = response.content
    if isinstance(content, list):
        content = "".join([
            c["text"] if (isinstance(c, dict) and "text" in c) else str(c)
            for c in content
        ])
    return content if isinstance(content, str) else str(content)

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0  # Radius of Earth in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

CUISINE_KEYWORDS = {
    "Japanese": ["japanese", "sushi", "yakiniku", "ramen", "yakitori"],
    "Korean": ["korean"],
    "Chinese": ["chinese", "noodle", "cantonese", "shanghainese", "dim sum", "dumpling"],
    "Western": ["western", "american", "european", "french", "steak", "bistro", "pizza", "italian", "mediterranean"],
    "Italian": ["italian", "pizza"],
    "Thai": ["thai"],
    "Cafe": ["cafe", "coffee", "bakery", "cake", "espresso"],
    "Dessert": ["dessert", "cake", "bakery", "sweet"],
    "Halal": ["halal", "indian muslim", "mamak"],
    "Seafood": ["seafood", "crab", "fish"],
    "Malaysian": ["malaysian", "nyonya", "mamak", "nasilemak"],
    "Indian": ["indian", "biryani", "chettinad", "hyderabadi", "kerala", "punjabi"]
}

def matches_cuisine(restaurant_categories: list[str], requested_cuisines: list[str]) -> bool:
    if not requested_cuisines:
        return True
    
    for req in requested_cuisines:
        req_lower = req.lower()
        # Direct check
        for cat in restaurant_categories:
            cat_lower = cat.lower()
            if req_lower in cat_lower:
                return True
        
        # Mapped check (sub-cuisines / informal mapping)
        sub_keywords = CUISINE_KEYWORDS.get(req, [])
        for sub in sub_keywords:
            for cat in restaurant_categories:
                if sub.lower() in cat.lower():
                    return True
    return False

def query_restaurants_by_proximity_and_cuisine(
    db,
    cuisines: list[str],
    latitude: float,
    longitude: float,
    radius_km: float = 10.0,
    price_level: int | None = None,
    dietary: list[str] = [],
) -> list:
    # 1. Encode user location into nearby geohashes (precision 5)
    hashes_str = proximityhash.create_geohash(latitude, longitude, radius_km * 1000, 5)
    geohash_list = hashes_str.split(',')
    
    # 2. Query candidates from DB that are in those geohash cells (prefix check)
    candidates = (
        db.query(RestaurantModel)
        .filter(func.substr(RestaurantModel.geohash, 1, 5).in_(geohash_list))
        .all()
    )
    
    # 3. Post-filter candidates in Python
    filtered = []
    for c in candidates:
        dist = calculate_haversine_distance(latitude, longitude, c.latitude, c.longitude)
        if dist > radius_km:
            continue
            
        if not matches_cuisine(c.cuisine, cuisines):
            continue

        # Filter by price level (only if specified and restaurant has price data)
        if price_level is not None and c.price_level is not None:
            if c.price_level > price_level:
                continue

        # Filter by dietary (re-use cuisine matching logic on dietary tags)
        if dietary:
            if not matches_cuisine(c.dietary, dietary):
                continue
            
        filtered.append((c, dist))
        
    # 4. Sort candidates:
    # Primary: rating (descending)
    # Secondary: review_count (descending)
    # Third: distance (ascending)
    def sort_key(item):
        c, dist = item
        rating = c.rating if c.rating is not None else 0.0
        review_cnt = c.review_count if c.review_count is not None else 0
        return (-rating, -review_cnt, dist)
        
    sorted_items = sorted(filtered, key=sort_key)
    return sorted_items

def upsert_external_results(db, normalized_results: list[dict]):
    for data in normalized_results:
        place_id = data["google_place_id"]
        existing = db.query(RestaurantModel).filter(RestaurantModel.google_place_id == place_id).first()
        if existing:
            # Update only non-NULL fields
            for key, val in data.items():
                if val is not None:
                    setattr(existing, key, val)
            existing.updated_at = datetime.now()
        else:
            constructor_data = {k: v for k, v in data.items() if k != "geohash"}
            new_restaurant = RestaurantModel(**constructor_data)
            db.add(new_restaurant)
    db.commit()


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

async def _fetch_external(
    loop: asyncio.AbstractEventLoop,
    cuisines: list[str],
    latitude: float,
    longitude: float,
    radius_km: float,
) -> list[dict]:
    """Call search_external_restaurants for every cuisine in parallel.
    Falls back to a single generic search when no cuisine is specified."""
    radius_m = int(radius_km * 1000)
    if cuisines:
        tasks = [
            loop.run_in_executor(
                _executor,
                search_external_restaurants,
                cuisine, latitude, longitude, radius_m,
            )
            for cuisine in cuisines
        ]
        batches = await asyncio.gather(*tasks, return_exceptions=True)
        return [
            r
            for batch in batches
            if isinstance(batch, list)
            for r in batch
        ]
    else:
        result = await loop.run_in_executor(
            _executor,
            search_external_restaurants,
            "", latitude, longitude, radius_m,
        )
        return result if isinstance(result, list) else []


def _upsert_deduped(db, external_results: list[dict]) -> None:
    """Deduplicate by google_place_id and upsert into the database."""
    seen: set[str] = set()
    unique: list[dict] = []
    for r in external_results:
        pid = r.get("google_place_id")
        if pid and pid not in seen:
            seen.add(pid)
            unique.append(r)
    if unique:
        upsert_external_results(db, unique)


def _map_to_results(selected: list[tuple]) -> list[RestaurantResult]:
    """Convert (RestaurantModel, distance_float) tuples to RestaurantResult objects."""
    results = []
    for r, dist in selected:
        results.append(
            RestaurantResult(
                id=r.id,
                name=r.name,
                cuisine=','.join(r.cuisine) if r.cuisine else "Any",
                rating=r.rating if r.rating is not None else 0.0,
                address=','.join(r.address) if r.address else "",
                latitude=r.latitude,
                longitude=r.longitude,
                review_count=r.review_count,
                distance=dist,
                summary=r.summary or r.about or "No summary available.",
                source=r.source,
            )
        )
    return results


async def chat_with_restaurant_search(
    messages: list[dict],
    db,
    latitude: float | None = None,
    longitude: float | None = None
) -> tuple[str, list[RestaurantResult]]:
    llm = get_llm()

    # 1. Get latest user message
    latest_user = next(
        (m["content"] for m in reversed(messages) if m["role"] == "user"),
        "",
    )
    if not latest_user:
        return "i didn't catch that. What kind of food are you looking for?", []

    # 2. Chain 1 — extract intent (includes distance, price, dietary)
    intent = await extract_intent(llm, latest_user)

    restaurants: list[RestaurantResult] = []

    # 3. Handle location requirement when search is needed
    if intent.needs_restaurant_search:
        if latitude is None or longitude is None:
            reply = "Please press the 'Locate Me' button so I can search for restaurants near your current location."
            return reply, []

        # Use radius from intent if user specified, otherwise default 10km
        radius_km = intent.max_distance_km if intent.max_distance_km else 10.0
        loop = asyncio.get_event_loop()

        # Step 1: Database-First Search (with price + dietary filters)
        db_results = query_restaurants_by_proximity_and_cuisine(
            db, intent.cuisines, latitude, longitude,
            radius_km=radius_km,
            price_level=intent.price_level,
            dietary=intent.dietary,
        )

        if len(db_results) >= 3:
            selected = db_results[:3]
        else:
            needed_count = 3 - len(db_results)
            # Step 2: Not enough in DB — call external APIs (Google Places / SerpAPI) in parallel
            external_results = await _fetch_external(
                loop, intent.cuisines, latitude, longitude, radius_km
            )
            
            existing_place_ids = {r.google_place_id for r, _ in db_results if r.google_place_id}
            existing_names = {r.name.lower().strip() for r, _ in db_results}
            
            new_external_results = []
            for r in external_results:
                p_id = r.get("google_place_id")
                name = r.get("name", "").lower().strip()
                if p_id in existing_place_ids or name in existing_names:
                    continue
                new_external_results.append(r)
                
            selected_external = new_external_results[:needed_count]
            _upsert_deduped(db, selected_external)

            # Re-query DB after upserting fresh external data
            db_results = query_restaurants_by_proximity_and_cuisine(
                db, intent.cuisines, latitude, longitude,
                radius_km=radius_km,
                price_level=intent.price_level,
                dietary=intent.dietary,
            )
            selected = db_results[:3]

        restaurants = _map_to_results(selected)

    # 4. Graceful fallback — each stage calls external APIs before querying DB
    if intent.needs_restaurant_search and not restaurants:
        expanded_radius = radius_km * 1.5

        # --- Fallback 1: Same cuisine, expanded radius — fetch fresh external data first ---
        fb1_external = await _fetch_external(
            loop, intent.cuisines, latitude, longitude, expanded_radius
        )
        _upsert_deduped(db, fb1_external)

        # Query DB with wider radius (price/dietary filters relaxed to maximise results)
        fallback_results = query_restaurants_by_proximity_and_cuisine(
            db, intent.cuisines, latitude, longitude, radius_km=expanded_radius
        )
        if fallback_results:
            restaurants = _map_to_results(fallback_results[:3])
            latest_user = (
                latest_user +
                f"\n[Note: No exact matches found within {radius_km:.0f}km. "
                f"Showing results within {expanded_radius:.0f}km instead.]"
            )
        else:
            # --- Fallback 2: No cuisine filter — fetch generic external data first ---
            fb2_external = await loop.run_in_executor(
                _executor,
                search_external_restaurants,
                "", latitude, longitude, int(expanded_radius * 1000),
            )
            if isinstance(fb2_external, list):
                _upsert_deduped(db, fb2_external)

            any_nearby = query_restaurants_by_proximity_and_cuisine(
                db, [], latitude, longitude, radius_km=expanded_radius
            )
            if any_nearby:
                restaurants = _map_to_results(any_nearby[:3])
                latest_user = (
                    latest_user +
                    "\n[Note: No matching cuisine found nearby. "
                    "Showing highly-rated restaurants in the area instead.]"
                )
            else:
                # All stages exhausted — nothing found anywhere
                reply = (
                    "I couldn't find any restaurants near your location right now. "
                    "Try moving to a different area or broadening your search."
                )
                return reply, []

    # 5. Chain 2 — grounded reply
    reply = await generate_answer(llm, latest_user, restaurants)
    return reply, restaurants
