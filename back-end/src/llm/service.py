from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_ollama import ChatOllama
from src.llm.tools.restaurant_tool import make_restaurant_search_tool
from src.llm.chains.intent_chain import extract_intent
from src.llm.chains.answer_chain import generate_answer
from langchain_core.messages.base import BaseMessage
from src.llm.schemas import RestaurantResult
from src.llm.suggestions import build_suggestions
import proximityhash
import math
import asyncio
from concurrent.futures import ThreadPoolExecutor
from sqlalchemy import func
from datetime import datetime
from src.database.models.restaurants import RestaurantModel
from src.services.external_search import (
    search_external_restaurants,
    NormalisedExternalRestaurant,
    HashlessExternalRestaurant
    )
from langchain_core.language_models.chat_models import BaseChatModel
from sqlalchemy.orm import Session
import uuid_utils.compat as uuid
from . import config

# Thread pool for running synchronous external API calls concurrently
_executor = ThreadPoolExecutor(max_workers=5)

SYSTEM_PROMPT = """You are BiteScouts AI, a friendly dining discovery assistant in Kuala Lumpur.
Help users choose restaurants based on cuisine, mood, budget, dietary needs (halal, vegetarian), and distance.
Keep replies concise (2-4 sentences). Suggest specific restaurant types or areas when possible."""


def get_llm()->BaseChatModel:
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


def _to_langchain_messages(messages: list[dict]) -> list[BaseMessage]:
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
    db:Session,
    cuisines: list[str],
    latitude: float,
    longitude: float,
    radius_km: float = 10.0,
    price_level: int | None = None,
    dietary: list[str] = [],
) -> list:
    # 1. Encode user location into nearby geohashes (precision 5)
    #   (maximum X axis error, in km)     
    # 1   5,009.4km x 4,992.6km
    # 2   1,252.3km x 624.1km
    # 3   156.5km x 156km
    # 4   39.1km x 19.5km
    # 5   4.9km x 4.9km
    # 6   1.2km x 609.4m, good for raddius >10 km, with max MoErr of 1 km (10%)
    # 7   152.9m x 152.4m good for raddius 1-5, with max MoErr of 200m (20% - 5% respectively)
    # 8   38.2m x 19m
    # 9   4.8m x 4.8m
    # 10  1.2m x 59.5cm
    # 11  14.9cm x 14.9cm
    # 12  3.7cm x 1.9cm 
    import pygeohash as gh
    # Allow for caching?
    lat,long =gh.decode(gh.encode(latitude,longitude,7))
    hashes_str = proximityhash.create_geohash(latitude, longitude, radius_km * 1000, 7, georaptor_flag=True)
    
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

def upsert_external_results(db:Session, normalized_results: list[NormalisedExternalRestaurant]):
    for data in normalized_results:
        place_id = data["google_place_id"]
        existing = db.query(RestaurantModel).filter(RestaurantModel.google_place_id == place_id).first()
        if place_id and existing:
            # Update only non-NULL fields
            for key, val in data.items():
                if val is not None:
                    setattr(existing, key, val)
            existing.updated_at = datetime.now()
        else:
            constructor_data = {k: v for k, v in data.items() if k != "geohash"}
            new_restaurant = RestaurantModel(**constructor_data) # type: ignore[arg-type]
            db.add(new_restaurant)
    db.commit()


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

RESULT_LIMIT = 3


async def _fetch_external(
    loop: asyncio.AbstractEventLoop,
    cuisines: list[str],
    latitude: float,
    longitude: float,
    radius_km: float,
) -> list[NormalisedExternalRestaurant]:
    """One external search: primary cuisine only (or generic if none).

    Strict gap-fill only needs enough new places to fill remaining slots,
    so we avoid one SerpAPI call per cuisine.
    """
    radius_m = int(radius_km * 1000)
    cuisine = cuisines[0] if cuisines else ""
    result = await loop.run_in_executor(
        _executor,
        search_external_restaurants,
        cuisine, latitude, longitude, radius_m,
    )
    return result if isinstance(result, list) else []


def _upsert_deduped(db, external_results: list[NormalisedExternalRestaurant]) -> None:
    """Deduplicate by google_place_id and upsert into the database."""
    seen: set[str] = set()
    unique: list[NormalisedExternalRestaurant] = []
    for r in external_results:
        pid = r.get("google_place_id")
        if pid and pid not in seen:
            seen.add(pid)
            unique.append(r)
    if unique:
        upsert_external_results(db, unique)


def _map_to_results(selected: list[tuple[RestaurantModel,float]]) -> list[RestaurantResult]:
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


def _exclude_shown(
    ranked: list[tuple],
    exclude_ids: set,
) -> list[tuple]:
    """Drop restaurants already shown when paging to the next top 3."""
    if not exclude_ids:
        return ranked
    return [
        (r, dist) for r, dist in ranked
        if getattr(r, "id", None) not in exclude_ids
    ]


def _take_top(ranked: list[tuple], limit: int = RESULT_LIMIT) -> list[tuple]:
    return ranked[:limit]


def _merge_unique(primary: list[tuple], extra: list[tuple], limit: int = RESULT_LIMIT) -> list[tuple]:
    """Keep primary order, then append extras not already selected (by id)."""
    seen: set = {getattr(r, "id", None) for r, _ in primary}
    merged = list(primary)
    for item in extra:
        r, _ = item
        rid = getattr(r, "id", None)
        if rid in seen:
            continue
        seen.add(rid)
        merged.append(item)
        if len(merged) >= limit:
            break
    return merged[:limit]


def _fresh_external_slice(
    external_results: list[NormalisedExternalRestaurant],
    db_results: list[tuple],
    needed: int,
) -> list[NormalisedExternalRestaurant]:
    """Keep only places not already in DB, capped at the gap size."""
    if needed <= 0:
        return []
    existing_place_ids = {r.google_place_id for r, _ in db_results if r.google_place_id}
    existing_names = {r.name.lower().strip() for r, _ in db_results}
    fresh: list[NormalisedExternalRestaurant] = []
    for r in external_results:
        p_id = r.get("google_place_id")
        name = (r.get("name") or "").lower().strip()
        if p_id in existing_place_ids or name in existing_names:
            continue
        fresh.append(r)
        if len(fresh) >= needed:
            break
    return fresh


async def _gap_fill_external(
    db,
    loop: asyncio.AbstractEventLoop,
    selected: list[tuple],
    exclude_ids: set,
    *,
    cuisines: list[str],
    latitude: float,
    longitude: float,
    radius_km: float,
    price_level: int | None = None,
    dietary: list[str] | None = None,
) -> list[tuple]:
    """If selected has fewer than RESULT_LIMIT, SerpAPI only for the remaining gap."""
    if len(selected) >= RESULT_LIMIT:
        return selected[:RESULT_LIMIT]

    needed = RESULT_LIMIT - len(selected)
    external_results = await _fetch_external(
        loop, cuisines, latitude, longitude, radius_km
    )

    # Known rows before upsert (used to skip duplicates)
    prior_db = query_restaurants_by_proximity_and_cuisine(
        db, cuisines, latitude, longitude,
        radius_km=radius_km,
        price_level=price_level,
        dietary=dietary or [],
    )
    fresh = _fresh_external_slice(external_results, prior_db, needed)
    if not fresh:
        return selected

    _upsert_deduped(db, fresh)

    db_results = query_restaurants_by_proximity_and_cuisine(
        db, cuisines, latitude, longitude,
        radius_km=radius_km,
        price_level=price_level,
        dietary=dietary or [],
    )
    available = _exclude_shown(db_results, exclude_ids)
    return _merge_unique(selected, available, RESULT_LIMIT)


async def chat_with_restaurant_search(
    messages: list[dict],
    db:Session,
    latitude: float | None = None,
    longitude: float | None = None,
    exclude_restaurant_ids: list[uuid.UUID] | None = None,
) -> tuple[str, list[RestaurantResult], list[str]]:
    llm = get_llm()

    # 1. Get latest user message
    latest_user = next(
        (m["content"] for m in reversed(messages) if m["role"] == "user"),
        "",
    )
    if not latest_user:
        reply = "I didn't catch that. What kind of food are you looking for?"
        return reply, [], build_suggestions(None, [])

    # 2. Chain 1 — extract intent (includes distance, price, dietary + more-alternatives)
    intent = await extract_intent(llm, latest_user, messages)

    # Asking for more options always requires a restaurant search
    if intent.wants_more_alternatives:
        intent.needs_restaurant_search = True

    # Only skip already-shown places when the user asked for alternatives
    exclude_ids: set = set()
    if intent.wants_more_alternatives and exclude_restaurant_ids:
        exclude_ids = set(exclude_restaurant_ids)

    restaurants: list[RestaurantResult] = []
    radius_km = intent.max_distance_km if intent.max_distance_km else 10.0
    loop = asyncio.get_event_loop()
    selected: list[tuple] = []
    used_fallback_note: str | None = None
    
    # 3. Handle location requirement when search is needed
    if latitude is None or longitude is None:
        reply = "Please press the 'Locate Me' button so I can search for restaurants near your current location."
        return reply, [], build_suggestions(intent, [], needs_location=True)
    # 2.5 If search is not needed, then return reply (asking for more info) and empty list early
    if not intent.needs_restaurant_search:
        reply = await generate_answer(llm, latest_user,restaurants)
        suggestions = build_suggestions(intent, restaurants)
        return reply, restaurants, suggestions
    # Step 1: Exhaust local DB matches first
    db_results = query_restaurants_by_proximity_and_cuisine(
        db, intent.cuisines, latitude, longitude,
        radius_km=radius_km,
        price_level=intent.price_level,
        dietary=intent.dietary,
    )
    selected = _take_top(_exclude_shown(db_results, exclude_ids))
    # Step 2: Strict gap-fill — SerpAPI only for remaining slots (e.g. 2 local → 1 call worth)
    if len(selected) < RESULT_LIMIT:
        selected = await _gap_fill_external(
            db, loop, selected, exclude_ids,
            cuisines=intent.cuisines,
            latitude=latitude,
            longitude=longitude,
            radius_km=radius_km,
            price_level=intent.price_level,
            dietary=intent.dietary,
        )
    restaurants = _map_to_results(selected)

    # 4. Fallbacks — widen/relax local DB first; SerpAPI only to fill remaining gap
    if len(selected) < RESULT_LIMIT:
        expanded_radius = radius_km * 1.5
        count_before_fb1 = len(selected)

        # --- Fallback 1: Same cuisine, expanded radius — DB first ---
        fallback_results = query_restaurants_by_proximity_and_cuisine(
            db, intent.cuisines, latitude, longitude, radius_km=expanded_radius
        )
        selected = _merge_unique(
            selected,
            _exclude_shown(fallback_results, exclude_ids),
            RESULT_LIMIT,
        )

        if len(selected) < RESULT_LIMIT:
            selected = await _gap_fill_external(
                db, loop, selected, exclude_ids,
                cuisines=intent.cuisines,
                latitude=latitude,
                longitude=longitude,
                radius_km=expanded_radius,
            )

        if len(selected) > count_before_fb1:
            if intent.wants_more_alternatives:
                used_fallback_note = (
                    "\n[Note: Showing further alternatives with a wider search radius.]"
                )
            else:
                used_fallback_note = (
                    f"\n[Note: No exact matches found within {radius_km:.0f}km. "
                    f"Showing results within {expanded_radius:.0f}km instead.]"
                )

        # --- Fallback 2: No cuisine filter — DB first, then gap-fill ---
        if len(selected) < RESULT_LIMIT:
            count_before_fb2 = len(selected)
            any_nearby = query_restaurants_by_proximity_and_cuisine(
                db, [], latitude, longitude, radius_km=expanded_radius
            )
            selected = _merge_unique(
                selected,
                _exclude_shown(any_nearby, exclude_ids),
                RESULT_LIMIT,
            )

            if len(selected) < RESULT_LIMIT:
                selected = await _gap_fill_external(
                    db, loop, selected, exclude_ids,
                    cuisines=[],
                    latitude=latitude,
                    longitude=longitude,
                    radius_km=expanded_radius,
                )

            if len(selected) > count_before_fb2:
                used_fallback_note = (
                    "\n[Note: No matching cuisine found nearby. "
                    "Showing highly-rated restaurants in the area instead.]"
                )

        restaurants = _map_to_results(selected)

        if not restaurants:
            if intent.wants_more_alternatives and exclude_ids:
                reply = (
                    "I've shown you all the matching spots nearby for now. "
                    "Try a different cuisine, a wider area, or refine your filters."
                )
                return reply, [], build_suggestions(intent, [])
            reply = (
                "I couldn't find any restaurants near your location right now. "
                "Try moving to a different area or broadening your search."
            )
            return reply, [], build_suggestions(intent, [])

        if used_fallback_note:
            latest_user = latest_user + used_fallback_note

    # 5. Chain 2 — grounded reply
    reply = await generate_answer(llm, latest_user, restaurants)
    suggestions = build_suggestions(intent, restaurants)
    return reply, restaurants, suggestions
