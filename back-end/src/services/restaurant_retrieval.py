"""Restaurant retrieval for dual-user date plans (Agent 2) — no LLM."""
from __future__ import annotations

import datetime
import logging
import math
import os
from typing import Any, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from src.database.models.restaurants import DAYS_OF_WEEK, RestaurantModel
from src.database.models.user import ClientModel
from src.llm.service import (
    calculate_haversine_distance,
    matches_cuisine,
    query_restaurants_by_proximity_and_cuisine,
)

logger = logging.getLogger(__name__)

DATE_PLAN_RADIUS_KM = float(os.getenv("DATE_PLAN_RADIUS_KM", "10"))
DATE_PLAN_TOP_K = int(os.getenv("DATE_PLAN_TOP_K", "5"))
AVG_SPEED_KMH = 25.0  # urban heuristic for travel time


def _travel_minutes(distance_km: float) -> int:
    return max(5, int(math.ceil((distance_km / AVG_SPEED_KMH) * 60)))


def _weekday_name(d: datetime.date) -> str:
    return DAYS_OF_WEEK[d.weekday()]


def _is_open_during(
    restaurant: RestaurantModel,
    on_date: datetime.date,
    start: datetime.time,
    end: datetime.time,
) -> bool:
    hours = restaurant.opening_hours_struct or {}
    day = _weekday_name(on_date)
    shifts = hours.get(day) or hours.get(day.lower()) or []
    if not shifts:
        # Unknown hours — keep candidate rather than over-filtering
        return True
    meet_start = start
    meet_end = end
    for open_t, close_t in shifts:
        if open_t <= meet_start and close_t >= meet_end:
            return True
        # Also accept if open covers meeting start with at least 60 min open after
        if open_t <= meet_start < close_t:
            return True
    return False


def _price_fit(client_limits: list[str] | None, price_level: int | None) -> float:
    if price_level is None or not client_limits:
        return 0.5
    # Map rough labels to levels
    mapping = {"budget": 1, "$": 1, "moderate": 2, "$$": 2, "upscale": 3, "$$$": 3, "$$$$": 4}
    allowed = []
    for lim in client_limits:
        key = lim.strip().lower()
        if key in mapping:
            allowed.append(mapping[key])
        elif lim.isdigit():
            allowed.append(int(lim))
    if not allowed:
        return 0.5
    return 1.0 if price_level <= max(allowed) else 0.2


def _candidate_dict(
    restaurant: RestaurantModel,
    dist_a: float,
    dist_b: float,
) -> dict[str, Any]:
    cuisine = ", ".join(restaurant.cuisine or [])
    address = ", ".join(restaurant.address or []) if restaurant.address else None
    return {
        "id": str(restaurant.id),
        "name": restaurant.name,
        "cuisine": cuisine,
        "rating": restaurant.rating,
        "price_level": restaurant.price_level,
        "summary": restaurant.summary or restaurant.about,
        "photos": list(restaurant.photos or []),
        "address": address,
        "distance_a_km": round(dist_a, 2),
        "distance_b_km": round(dist_b, 2),
        "travel_time_a_min": _travel_minutes(dist_a),
        "travel_time_b_min": _travel_minutes(dist_b),
        "latitude": restaurant.latitude,
        "longitude": restaurant.longitude,
        "review_count": restaurant.review_count or 0,
    }


def retrieve_top_restaurants_for_pair(
    db: Session,
    client_a: ClientModel,
    client_b: ClientModel,
    *,
    on_date: datetime.date,
    meeting_time: datetime.time,
    window_end: datetime.time,
    radius_km: float = DATE_PLAN_RADIUS_KM,
    top_k: int = DATE_PLAN_TOP_K,
) -> list[dict[str, Any]]:
    """
    Filter restaurants within radius of BOTH users, open at meeting time,
    matching shared cuisine/dietary. Sort by highest rating among pulled set.
    """
    lat_a, lng_a = client_a.recent_latitude, client_a.recent_longitude
    lat_b, lng_b = client_b.recent_latitude, client_b.recent_longitude

    if None in (lat_a, lng_a, lat_b, lng_b):
        logger.warning("Missing location for one or both clients")
        return []

    # Midpoint search center
    mid_lat = (lat_a + lat_b) / 2
    mid_lng = (lng_a + lng_b) / 2

    cuisine_a = list(client_a.cuisine or [])
    cuisine_b = list(client_b.cuisine or [])
    shared_cuisine = list(set(cuisine_a) & set(cuisine_b)) if cuisine_a and cuisine_b else []
    search_cuisines = shared_cuisine or list(set(cuisine_a) | set(cuisine_b))

    dietary_a = list(client_a.dietary or [])
    dietary_b = list(client_b.dietary or [])
    # Restaurant must satisfy BOTH users' dietary needs
    combined_dietary = list(set(dietary_a) | set(dietary_b))

    # Pull from midpoint with slightly larger radius, then dual-filter
    pull_radius = max(radius_km, max(client_a.distance_limit or 5, client_b.distance_limit or 5))
    raw = query_restaurants_by_proximity_and_cuisine(
        db,
        search_cuisines,
        mid_lat,
        mid_lng,
        radius_km=pull_radius * 1.5,
        price_level=None,
        dietary=combined_dietary,
    )

    # If empty, relax cuisine
    if not raw and search_cuisines:
        raw = query_restaurants_by_proximity_and_cuisine(
            db, [], mid_lat, mid_lng, radius_km=pull_radius * 1.5, dietary=combined_dietary
        )
    if not raw and combined_dietary:
        raw = query_restaurants_by_proximity_and_cuisine(
            db, search_cuisines, mid_lat, mid_lng, radius_km=pull_radius * 1.5, dietary=[]
        )

    scored: list[tuple[float, dict]] = []
    seen: set[UUID] = set()

    for restaurant, _mid_dist in raw:
        if restaurant.id in seen:
            continue
        seen.add(restaurant.id)

        dist_a = calculate_haversine_distance(lat_a, lng_a, restaurant.latitude, restaurant.longitude)
        dist_b = calculate_haversine_distance(lat_b, lng_b, restaurant.latitude, restaurant.longitude)
        if dist_a > radius_km or dist_b > radius_km:
            continue

        if not _is_open_during(restaurant, on_date, meeting_time, window_end):
            continue

        if dietary_a and not matches_cuisine(restaurant.dietary or [], dietary_a):
            continue
        if dietary_b and not matches_cuisine(restaurant.dietary or [], dietary_b):
            continue

        rating = restaurant.rating if restaurant.rating is not None else 0.0
        review_cnt = restaurant.review_count or 0
        avg_dist = (dist_a + dist_b) / 2
        cuisine_score = 1.0 if shared_cuisine and matches_cuisine(restaurant.cuisine or [], shared_cuisine) else 0.5
        price_score = (
            _price_fit(client_a.price_limit, restaurant.price_level)
            + _price_fit(client_b.price_limit, restaurant.price_level)
        ) / 2

        # Primary ranking signal: highest rating among pulled candidates
        # Secondary: reviews, then distance, then soft prefs
        sort_key = (rating, review_cnt, -avg_dist, cuisine_score, price_score)
        scored.append((sort_key, _candidate_dict(restaurant, dist_a, dist_b)))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [item for _, item in scored[:top_k]]
