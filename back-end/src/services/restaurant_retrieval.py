"""Restaurant retrieval for dual-user date plans (Agent 2) — no LLM."""
from __future__ import annotations

import datetime
import logging
import math
import os
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from src.database.models.restaurants import DAYS_OF_WEEK, RestaurantModel
from src.database.models.user import ClientModel
from src.llm.service import (
    calculate_haversine_distance,
    matches_cuisine,
    query_restaurants_by_proximity_and_cuisine,
    upsert_external_results,
)
from src.services.external_search import search_external_restaurants

logger = logging.getLogger(__name__)

DATE_PLAN_RADIUS_KM = float(os.getenv("DATE_PLAN_RADIUS_KM", "10"))
DATE_PLAN_TOP_K = int(os.getenv("DATE_PLAN_TOP_K", "5"))
DATE_PLAN_FETCH_MORE = int(os.getenv("DATE_PLAN_FETCH_MORE", "3"))
DATE_PLAN_SNAPSHOT_MAX = int(os.getenv("DATE_PLAN_SNAPSHOT_MAX", "15"))
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


def _query_local_raw(
    db: Session,
    *,
    search_cuisines: list[str],
    mid_lat: float,
    mid_lng: float,
    pull_radius: float,
    combined_dietary: list[str],
) -> list[tuple[RestaurantModel, float]]:
    """Local DB pull with progressive relaxations (no external APIs)."""
    raw = query_restaurants_by_proximity_and_cuisine(
        db,
        search_cuisines,
        mid_lat,
        mid_lng,
        radius_km=pull_radius * 1.5,
        price_level=None,
        dietary=combined_dietary,
    )

    if not raw and search_cuisines:
        raw = query_restaurants_by_proximity_and_cuisine(
            db, [], mid_lat, mid_lng, radius_km=pull_radius * 1.5, dietary=combined_dietary
        )
    if not raw and combined_dietary:
        raw = query_restaurants_by_proximity_and_cuisine(
            db, search_cuisines, mid_lat, mid_lng, radius_km=pull_radius * 1.5, dietary=[]
        )
    if not raw and search_cuisines and combined_dietary:
        raw = query_restaurants_by_proximity_and_cuisine(
            db, [], mid_lat, mid_lng, radius_km=pull_radius * 1.5, dietary=[]
        )
    return raw


def _score_pair_candidates(
    raw: list[tuple[RestaurantModel, float]],
    *,
    lat_a: float,
    lng_a: float,
    lat_b: float,
    lng_b: float,
    radius_km: float,
    on_date: datetime.date,
    meeting_time: datetime.time,
    window_end: datetime.time,
    dietary_a: list[str],
    dietary_b: list[str],
    shared_cuisine: list[str],
    client_a: ClientModel,
    client_b: ClientModel,
    enforce_dietary: bool = True,
) -> list[tuple[tuple, dict[str, Any]]]:
    scored: list[tuple[tuple, dict[str, Any]]] = []
    seen: set[UUID] = set()

    for restaurant, _mid_dist in raw:
        if restaurant.id in seen:
            continue
        seen.add(restaurant.id)

        dist_a = calculate_haversine_distance(
            lat_a, lng_a, restaurant.latitude, restaurant.longitude
        )
        dist_b = calculate_haversine_distance(
            lat_b, lng_b, restaurant.latitude, restaurant.longitude
        )
        if dist_a > radius_km or dist_b > radius_km:
            continue

        if not _is_open_during(restaurant, on_date, meeting_time, window_end):
            continue

        if enforce_dietary:
            if dietary_a and not matches_cuisine(restaurant.dietary or [], dietary_a):
                continue
            if dietary_b and not matches_cuisine(restaurant.dietary or [], dietary_b):
                continue

        rating = restaurant.rating if restaurant.rating is not None else 0.0
        review_cnt = restaurant.review_count or 0
        avg_dist = (dist_a + dist_b) / 2
        cuisine_score = (
            1.0
            if shared_cuisine and matches_cuisine(restaurant.cuisine or [], shared_cuisine)
            else 0.5
        )
        price_score = (
            _price_fit(client_a.price_limit, restaurant.price_level)
            + _price_fit(client_b.price_limit, restaurant.price_level)
        ) / 2

        sort_key = (rating, review_cnt, -avg_dist, cuisine_score, price_score)
        scored.append((sort_key, _candidate_dict(restaurant, dist_a, dist_b)))

    scored.sort(key=lambda x: x[0], reverse=True)
    return scored


def _upsert_deduped(db: Session, external_results: list[dict]) -> int:
    """Deduplicate by google_place_id and upsert. Returns count upserted."""
    seen: set[str] = set()
    unique: list[dict] = []
    for r in external_results:
        pid = r.get("google_place_id")
        if pid and pid not in seen:
            seen.add(pid)
            unique.append(r)
    if not unique:
        return 0
    upsert_external_results(db, unique)
    return len(unique)


def _external_mutual_fill(
    db: Session,
    *,
    shared_cuisine: list[str],
    mid_lat: float,
    mid_lng: float,
    pull_radius: float,
    search_cuisines: list[str] | None = None,
) -> int:
    """
    Exactly one SerpAPI/Google Places call at the meetup midpoint.
    Prefers mutual cuisine; falls back to first search cuisine.
    Upserts results into the restaurant DB. Returns number of rows upserted.
    """
    cuisine_list = shared_cuisine or (search_cuisines or [])
    if not cuisine_list:
        logger.info("Skipping external fill — no cuisine preference")
        return 0

    cuisine = cuisine_list[0]
    radius_m = int(pull_radius * 1.5 * 1000)
    logger.info(
        "Date-plan external fill (1 call): cuisine=%s mid=(%.5f,%.5f) radius_m=%d",
        cuisine,
        mid_lat,
        mid_lng,
        radius_m,
    )
    try:
        external = search_external_restaurants(cuisine, mid_lat, mid_lng, radius_m)
    except Exception as exc:
        logger.exception("External restaurant search failed: %s", exc)
        return 0

    if not isinstance(external, list) or not external:
        logger.info("External search returned no restaurants")
        return 0

    return _upsert_deduped(db, external)


def _pair_search_context(
    client_a: ClientModel,
    client_b: ClientModel,
    *,
    radius_km: float,
) -> dict[str, Any] | None:
    lat_a, lng_a = client_a.recent_latitude, client_a.recent_longitude
    lat_b, lng_b = client_b.recent_latitude, client_b.recent_longitude

    if None in (lat_a, lng_a, lat_b, lng_b):
        logger.warning("Missing location for one or both clients")
        return None

    mid_lat = (lat_a + lat_b) / 2
    mid_lng = (lng_a + lng_b) / 2

    cuisine_a = list(client_a.cuisine or [])
    cuisine_b = list(client_b.cuisine or [])
    shared_cuisine = list(set(cuisine_a) & set(cuisine_b)) if cuisine_a and cuisine_b else []
    search_cuisines = shared_cuisine or list(set(cuisine_a) | set(cuisine_b))

    dietary_a = list(client_a.dietary or [])
    dietary_b = list(client_b.dietary or [])
    combined_dietary = list(set(dietary_a) | set(dietary_b))

    pull_radius = max(
        radius_km,
        max(client_a.distance_limit or 5, client_b.distance_limit or 5),
    )

    return {
        "lat_a": lat_a,
        "lng_a": lng_a,
        "lat_b": lat_b,
        "lng_b": lng_b,
        "mid_lat": mid_lat,
        "mid_lng": mid_lng,
        "shared_cuisine": shared_cuisine,
        "search_cuisines": search_cuisines,
        "dietary_a": dietary_a,
        "dietary_b": dietary_b,
        "combined_dietary": combined_dietary,
        "pull_radius": pull_radius,
        "radius_km": radius_km,
        "client_a": client_a,
        "client_b": client_b,
    }


def _filter_excluded(
    scored: list[tuple[tuple, dict[str, Any]]],
    exclude_ids: set[str],
) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for _, item in scored:
        rid = str(item.get("id", ""))
        if rid and rid not in exclude_ids:
            out.append(item)
    return out


def _score_local(
    db: Session,
    ctx: dict[str, Any],
    *,
    on_date: datetime.date,
    meeting_time: datetime.time,
    window_end: datetime.time,
    enforce_dietary: bool = True,
) -> list[tuple[tuple, dict[str, Any]]]:
    raw = _query_local_raw(
        db,
        search_cuisines=ctx["search_cuisines"],
        mid_lat=ctx["mid_lat"],
        mid_lng=ctx["mid_lng"],
        pull_radius=ctx["pull_radius"],
        combined_dietary=ctx["combined_dietary"],
    )
    return _score_pair_candidates(
        raw,
        lat_a=ctx["lat_a"],
        lng_a=ctx["lng_a"],
        lat_b=ctx["lat_b"],
        lng_b=ctx["lng_b"],
        radius_km=ctx["radius_km"],
        on_date=on_date,
        meeting_time=meeting_time,
        window_end=window_end,
        dietary_a=ctx["dietary_a"],
        dietary_b=ctx["dietary_b"],
        shared_cuisine=ctx["shared_cuisine"],
        client_a=ctx["client_a"],
        client_b=ctx["client_b"],
        enforce_dietary=enforce_dietary,
    )


def _rescore_after_external(
    db: Session,
    ctx: dict[str, Any],
    *,
    on_date: datetime.date,
    meeting_time: datetime.time,
    window_end: datetime.time,
) -> list[tuple[tuple, dict[str, Any]]]:
    """Re-query local DB after upsert; relax dietary if needed for external rows."""
    cuisines = ctx["shared_cuisine"] or ctx["search_cuisines"]
    raw = _query_local_raw(
        db,
        search_cuisines=cuisines,
        mid_lat=ctx["mid_lat"],
        mid_lng=ctx["mid_lng"],
        pull_radius=ctx["pull_radius"],
        combined_dietary=ctx["combined_dietary"],
    )
    scored = _score_pair_candidates(
        raw,
        lat_a=ctx["lat_a"],
        lng_a=ctx["lng_a"],
        lat_b=ctx["lat_b"],
        lng_b=ctx["lng_b"],
        radius_km=ctx["radius_km"],
        on_date=on_date,
        meeting_time=meeting_time,
        window_end=window_end,
        dietary_a=ctx["dietary_a"],
        dietary_b=ctx["dietary_b"],
        shared_cuisine=ctx["shared_cuisine"],
        client_a=ctx["client_a"],
        client_b=ctx["client_b"],
    )
    if not scored and (ctx["dietary_a"] or ctx["dietary_b"]):
        scored = _score_pair_candidates(
            raw,
            lat_a=ctx["lat_a"],
            lng_a=ctx["lng_a"],
            lat_b=ctx["lat_b"],
            lng_b=ctx["lng_b"],
            radius_km=ctx["radius_km"],
            on_date=on_date,
            meeting_time=meeting_time,
            window_end=window_end,
            dietary_a=ctx["dietary_a"],
            dietary_b=ctx["dietary_b"],
            shared_cuisine=ctx["shared_cuisine"],
            client_a=ctx["client_a"],
            client_b=ctx["client_b"],
            enforce_dietary=False,
        )
    return scored


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
    exclude_ids: set[str] | None = None,
) -> list[dict[str, Any]]:
    """
    Filter restaurants within radius of BOTH users, open at meeting time,
    matching shared cuisine/dietary. Sort by highest rating among pulled set.

    Order: local restaurant DB first; if fewer than top_k after excludes,
    one SerpAPI/Google Places search, upsert, then re-score.
    """
    excluded = {str(x) for x in (exclude_ids or set())}
    ctx = _pair_search_context(client_a, client_b, radius_km=radius_km)
    if not ctx:
        return []

    try:
        import pygeohash as gh

        meetup_gh = gh.encode(ctx["mid_lat"], ctx["mid_lng"])[:5]
        logger.info(
            "Date-plan restaurant pull around meetup geohash=%s radius=%.1fkm",
            meetup_gh,
            radius_km,
        )
    except Exception:
        pass

    scored = _score_local(
        db,
        ctx,
        on_date=on_date,
        meeting_time=meeting_time,
        window_end=window_end,
    )
    results = _filter_excluded(scored, excluded)

    # External fill when we still need more slots
    if len(results) < top_k and (ctx["shared_cuisine"] or ctx["search_cuisines"]):
        upserted = _external_mutual_fill(
            db,
            shared_cuisine=ctx["shared_cuisine"],
            mid_lat=ctx["mid_lat"],
            mid_lng=ctx["mid_lng"],
            pull_radius=ctx["pull_radius"],
            search_cuisines=ctx["search_cuisines"],
        )
        if upserted:
            scored = _rescore_after_external(
                db,
                ctx,
                on_date=on_date,
                meeting_time=meeting_time,
                window_end=window_end,
            )
            results = _filter_excluded(scored, excluded)
    elif len(results) < top_k:
        logger.info(
            "Fewer than top_k local restaurants and no cuisine — skipping external search"
        )

    return results[:top_k]


def fetch_more_restaurants_for_pair(
    db: Session,
    client_a: ClientModel,
    client_b: ClientModel,
    *,
    on_date: datetime.date,
    meeting_time: datetime.time,
    window_end: datetime.time,
    exclude_ids: set[str],
    radius_km: float = DATE_PLAN_RADIUS_KM,
    limit: int = DATE_PLAN_FETCH_MORE,
) -> list[dict[str, Any]]:
    """
    Find additional restaurants not in exclude_ids.
    Local DB first; if none new, one external Places/SerpAPI call then re-score.
    """
    if limit <= 0:
        return []

    excluded = {str(x) for x in exclude_ids}
    ctx = _pair_search_context(client_a, client_b, radius_km=radius_km)
    if not ctx:
        return []

    scored = _score_local(
        db,
        ctx,
        on_date=on_date,
        meeting_time=meeting_time,
        window_end=window_end,
    )
    results = _filter_excluded(scored, excluded)

    if results:
        logger.info("Fetch-more: %d new restaurants from local DB", len(results[:limit]))
        return results[:limit]

    # No unused local matches — try external once
    if not (ctx["shared_cuisine"] or ctx["search_cuisines"]):
        logger.info("Fetch-more: no cuisine for external fill")
        return []

    upserted = _external_mutual_fill(
        db,
        shared_cuisine=ctx["shared_cuisine"],
        mid_lat=ctx["mid_lat"],
        mid_lng=ctx["mid_lng"],
        pull_radius=ctx["pull_radius"],
        search_cuisines=ctx["search_cuisines"],
    )
    if not upserted:
        return []

    scored = _rescore_after_external(
        db,
        ctx,
        on_date=on_date,
        meeting_time=meeting_time,
        window_end=window_end,
    )
    results = _filter_excluded(scored, excluded)
    logger.info("Fetch-more: %d new restaurants after external fill", len(results[:limit]))
    return results[:limit]
