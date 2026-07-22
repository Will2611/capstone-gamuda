"""Orchestrates Agents 2–4 after availability overlap is confirmed."""
from __future__ import annotations

import logging
import os
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from src.database.models.date_plan import DatePlanModel
from src.database.models.personal_connection import FoodMatchModel
from src.database.models.user import ClientModel
from src.llm.chains.date_planner_chain import generate_date_ideas, stub_date_ideas
from src.llm.chains.restaurant_rank_chain import rank_restaurants
from src.services import date_plan_cache as cache
from src.services.restaurant_retrieval import retrieve_top_restaurants_for_pair

logger = logging.getLogger(__name__)

USE_LLM = os.getenv("DATE_PLAN_USE_LLM", "true").lower() in ("1", "true", "yes")


def _get_match_clients(db: Session, match: FoodMatchModel) -> tuple[ClientModel, ClientModel]:
    a = db.query(ClientModel).filter(ClientModel.id == match.creator_id).first()
    b = db.query(ClientModel).filter(ClientModel.id == match.participant_id).first()
    if not a or not b:
        raise ValueError("Both match participants must be clients with profiles")
    return a, b


async def run_recommendation(db: Session, plan: DatePlanModel, *, force: bool = False) -> DatePlanModel:
    """Retrieve Top 5, rank, generate date ideas for index 0."""
    if (
        not force
        and plan.status == "restaurant_ready"
        and plan.candidate_snapshot
        and plan.date_ideas_payload
    ):
        return plan

    match = db.query(FoodMatchModel).filter(FoodMatchModel.id == plan.match_id).first()
    if not match:
        raise ValueError("Match not found")

    if not plan.overlap_date or not plan.meeting_time or not plan.overlap_end:
        raise ValueError("Plan has no confirmed overlap")

    plan.status = "recommending"
    db.add(plan)
    db.commit()
    db.refresh(plan)

    client_a, client_b = _get_match_clients(db, match)

    candidates = cache.cache_get(cache.candidates_key(str(plan.id)))
    if not candidates or force:
        candidates = retrieve_top_restaurants_for_pair(
            db,
            client_a,
            client_b,
            on_date=plan.overlap_date,
            meeting_time=plan.meeting_time,
            window_end=plan.overlap_end,
        )
        cache.cache_set(cache.candidates_key(str(plan.id)), candidates)

    if not candidates:
        plan.status = "overlap_found"
        plan.candidate_snapshot = []
        plan.candidate_restaurant_ids = []
        plan.ranking_payload = {"top_reason": "No suitable restaurant found.", "ranked_ids": []}
        plan.date_ideas_payload = None
        plan.selected_restaurant_id = None
        db.add(plan)
        db.commit()
        db.refresh(plan)
        return plan

    llm = None
    if USE_LLM:
        try:
            from src.llm.service import get_llm

            llm = get_llm()
        except Exception as exc:
            logger.warning("Could not init LLM: %s", exc)

    meetup = f"{plan.overlap_date.isoformat()} {plan.meeting_time.strftime('%H:%M')}"

    ranking = await rank_restaurants(
        llm,
        restaurants=candidates,
        cuisine_a=list(client_a.cuisine or []),
        cuisine_b=list(client_b.cuisine or []),
        dietary_a=list(client_a.dietary or []),
        dietary_b=list(client_b.dietary or []),
        vibes_a=list(client_a.preferred_vibes or []),
        vibes_b=list(client_b.preferred_vibes or []),
        persona_a=list(client_a.food_personality or []),
        persona_b=list(client_b.food_personality or []),
        meetup=meetup,
    ) if llm else {
        "ranked_ids": [c["id"] for c in candidates],
        "top_reason": "Highest-rated restaurant near both of you.",
        "vibe": "Casual",
    }

    # Reorder candidates by ranking
    by_id = {c["id"]: c for c in candidates}
    ordered = [by_id[i] for i in ranking["ranked_ids"] if i in by_id]
    for c in candidates:
        if c not in ordered:
            ordered.append(c)

    plan.candidate_snapshot = ordered
    plan.candidate_restaurant_ids = [UUID(c["id"]) for c in ordered]
    plan.candidate_index = 0
    plan.ranking_payload = ranking
    plan.selected_restaurant_id = UUID(ordered[0]["id"])

    ideas = await _ideas_for(
        llm, ordered[0], client_a, client_b, meetup, ranking.get("vibe", "Casual"), plan.id
    )
    plan.date_ideas_payload = ideas
    plan.status = "restaurant_ready"
    plan.version = (plan.version or 1) + 1
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


async def cycle_next_restaurant(db: Session, plan: DatePlanModel) -> DatePlanModel:
    """Choose another restaurant from cached Top 5 — no DB re-query."""
    snapshot = plan.candidate_snapshot or []
    if len(snapshot) < 2:
        return plan

    next_index = (plan.candidate_index + 1) % len(snapshot)
    plan.candidate_index = next_index
    restaurant = snapshot[next_index]
    plan.selected_restaurant_id = UUID(restaurant["id"])

    match = db.query(FoodMatchModel).filter(FoodMatchModel.id == plan.match_id).first()
    client_a, client_b = _get_match_clients(db, match)
    meetup = f"{plan.overlap_date.isoformat()} {plan.meeting_time.strftime('%H:%M')}"
    vibe = (plan.ranking_payload or {}).get("vibe", "Casual")

    llm = None
    if USE_LLM:
        try:
            from src.llm.service import get_llm

            llm = get_llm()
        except Exception:
            llm = None

    # Only regenerate ideas for the new #1 — do not re-retrieve
    ideas = await _ideas_for(llm, restaurant, client_a, client_b, meetup, vibe, plan.id)
    plan.date_ideas_payload = ideas
    if plan.ranking_payload:
        plan.ranking_payload = {
            **plan.ranking_payload,
            "top_reason": f"Alternative pick: {restaurant.get('name')} — still among your top matches.",
        }
    plan.version = (plan.version or 1) + 1
    plan.status = "restaurant_ready"
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


async def _ideas_for(llm, restaurant, client_a, client_b, meetup, vibe, plan_id) -> dict:
    cached = cache.cache_get(cache.ideas_key(str(plan_id), str(restaurant["id"])))
    if cached:
        return cached

    if llm:
        ideas = await generate_date_ideas(
            llm,
            restaurant=restaurant,
            foods_a=list(client_a.cuisine or []),
            foods_b=list(client_b.cuisine or []),
            persona_a=list(client_a.food_personality or []),
            persona_b=list(client_b.food_personality or []),
            dietary_a=list(client_a.dietary or []),
            dietary_b=list(client_b.dietary or []),
            meetup=meetup,
            vibe=vibe,
            use_llm=True,
        )
    else:
        ideas = stub_date_ideas(restaurant, meetup, vibe)

    cache.cache_set(cache.ideas_key(str(plan_id), str(restaurant["id"])), ideas)
    return ideas
