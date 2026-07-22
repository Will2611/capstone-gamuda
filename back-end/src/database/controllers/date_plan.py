"""Date plan REST API — availability, recommend, accept, cycle restaurant."""
from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from fastapi.responses import JSONResponse

from src.database.connection import db_dependency
from src.database.controllers.utils import CurrentUser
from src.database.models.chat import ChatMessageModel
from src.database.models.date_plan import DatePlanAvailabilityModel, DatePlanModel
from src.database.models.personal_connection import FoodMatchModel
from src.database.models.user import ClientModel
from src.database.schemas.date_plan import (
    AcceptSuggestionRequest,
    AvailabilityView,
    CreateDatePlanRequest,
    DateIdeasView,
    DatePlanResponse,
    NextRestaurantRequest,
    OverlapView,
    RestaurantCandidateView,
    SubmitAvailabilityRequest,
    SuggestedSlotView,
)
from src.services.availability_matching import TimeSlot, compute_overlap, validate_slot
from src.services.date_plan_orchestrator import cycle_next_restaurant, run_recommendation

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/date-plan", tags=["date-plan"])

# Simple in-memory rate counters: user_id -> list of timestamps
_rate_buckets: dict[str, list[float]] = {}


def _rate_limit(user_id: str, action: str, limit: int, window_sec: float = 60.0) -> None:
    import time

    key = f"{user_id}:{action}"
    now = time.time()
    bucket = [t for t in _rate_buckets.get(key, []) if now - t < window_sec]
    if len(bucket) >= limit:
        raise HTTPException(status_code=429, detail=f"Rate limit exceeded for {action}")
    bucket.append(now)
    _rate_buckets[key] = bucket


def _get_match_or_404(db, match_id: UUID) -> FoodMatchModel:
    match = db.query(FoodMatchModel).filter(FoodMatchModel.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match


def _assert_match_member(match: FoodMatchModel, user_id: UUID) -> None:
    if user_id not in (match.creator_id, match.participant_id):
        raise HTTPException(status_code=403, detail="Not a member of this match")


def _partner_id(match: FoodMatchModel, user_id: UUID) -> UUID:
    return match.participant_id if match.creator_id == user_id else match.creator_id


def _active_statuses():
    return (
        "draft",
        "waiting_partner",
        "no_overlap",
        "overlap_found",
        "recommending",
        "restaurant_ready",
    )


def _serialize_plan(
    db,
    plan: DatePlanModel,
    viewer_id: UUID,
) -> DatePlanResponse:
    rows = (
        db.query(DatePlanAvailabilityModel)
        .filter(DatePlanAvailabilityModel.date_plan_id == plan.id)
        .all()
    )
    yours = theirs = None
    for row in rows:
        view = AvailabilityView(
            user_id=row.user_id,
            available_date=row.available_date,
            start_time=row.start_time,
            end_time=row.end_time,
            timezone=row.timezone,
        )
        if row.user_id == viewer_id:
            yours = view
        else:
            theirs = view

    overlap = None
    if plan.overlap_date and plan.overlap_start and plan.overlap_end and plan.meeting_time:
        overlap = OverlapView(
            date=plan.overlap_date,
            start_time=plan.overlap_start,
            end_time=plan.overlap_end,
            meeting_time=plan.meeting_time,
        )

    suggested = None
    if plan.status == "no_overlap" and plan.ranking_payload and plan.ranking_payload.get("suggested"):
        from datetime import date as date_cls, time as time_cls

        s = plan.ranking_payload["suggested"]
        suggested = SuggestedSlotView(
            date=date_cls.fromisoformat(s["date"]) if isinstance(s["date"], str) else s["date"],
            start_time=time_cls.fromisoformat(s["start_time"])
            if isinstance(s["start_time"], str)
            else s["start_time"],
            end_time=time_cls.fromisoformat(s["end_time"])
            if isinstance(s["end_time"], str)
            else s["end_time"],
            meeting_time=time_cls.fromisoformat(s["meeting_time"])
            if isinstance(s["meeting_time"], str)
            else s["meeting_time"],
            rationale=s.get("rationale", ""),
        )

    recommendation = None
    ranking_reason = None
    date_ideas = None
    snapshot = plan.candidate_snapshot or []
    if snapshot and 0 <= plan.candidate_index < len(snapshot):
        c = snapshot[plan.candidate_index]
        recommendation = RestaurantCandidateView(
            id=UUID(str(c["id"])),
            name=c["name"],
            cuisine=c.get("cuisine") or "",
            rating=c.get("rating"),
            price_level=c.get("price_level"),
            summary=c.get("summary"),
            photos=c.get("photos") or [],
            address=c.get("address"),
            distance_a_km=c.get("distance_a_km", 0),
            distance_b_km=c.get("distance_b_km", 0),
            travel_time_a_min=c.get("travel_time_a_min", 0),
            travel_time_b_min=c.get("travel_time_b_min", 0),
            latitude=c.get("latitude"),
            longitude=c.get("longitude"),
        )
    if plan.ranking_payload:
        ranking_reason = plan.ranking_payload.get("top_reason")
    if plan.date_ideas_payload:
        try:
            date_ideas = DateIdeasView(**plan.date_ideas_payload)
        except Exception:
            date_ideas = None

    messages = {
        "waiting_partner": "Waiting for your match to submit their availability.",
        "no_overlap": "No matching availability found.",
        "overlap_found": "Date confirmed — preparing restaurant recommendations.",
        "recommending": "Finding the best restaurant for both of you…",
        "restaurant_ready": "Restaurant recommendation ready.",
        "accepted": "Food date plan accepted!",
        "cancelled": "Plan cancelled.",
    }

    return DatePlanResponse(
        id=plan.id,
        match_id=plan.match_id,
        chat_room_id=plan.chat_room_id,
        status=plan.status,  # type: ignore[arg-type]
        created_by=plan.created_by,
        yours=yours,
        theirs=theirs if len(rows) >= 2 or plan.status != "waiting_partner" else None,
        overlap=overlap,
        suggested=suggested,
        recommendation=recommendation,
        date_ideas=date_ideas,
        ranking_reason=ranking_reason,
        accepted_by=list(plan.accepted_by or []),
        candidate_index=plan.candidate_index or 0,
        candidate_count=len(snapshot),
        version=plan.version or 1,
        message=messages.get(plan.status),
    )


async def _broadcast_plan_event(room_id: Optional[UUID], event_type: str, payload: dict) -> None:
    if not room_id:
        return
    try:
        from src.database.controllers.chat import room_manager

        await room_manager.broadcast_to_room(
            str(room_id),
            {
                "type": event_type,
                "payload": payload,
                "timestamp": datetime.utcnow().isoformat(),
                "room_id": str(room_id),
            },
        )
    except Exception as exc:
        logger.warning("WS broadcast failed: %s", exc)


def _persist_system_message(db, room_id: Optional[UUID], text: str, payload: dict | None = None) -> None:
    if not room_id:
        return
    msg = ChatMessageModel(
        message=text,
        room_id=room_id,
        user_id=None,
        payloads_stringified=json.dumps(payload) if payload else None,
    )
    db.add(msg)


@router.post("", response_model=DatePlanResponse)
async def create_or_get_plan(
    payload: CreateDatePlanRequest,
    db: db_dependency,
    current_user: CurrentUser,
):
    match = _get_match_or_404(db, payload.match_id)
    _assert_match_member(match, current_user.id)

    existing = (
        db.query(DatePlanModel)
        .filter(
            DatePlanModel.match_id == match.id,
            DatePlanModel.status.in_(_active_statuses()),
        )
        .order_by(DatePlanModel.created_at.desc())
        .first()
    )
    if existing:
        return _serialize_plan(db, existing, current_user.id)

    plan = DatePlanModel(
        match_id=match.id,
        chat_room_id=match.chat_room_id,
        created_by=current_user.id,
        status="draft",
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return _serialize_plan(db, plan, current_user.id)


@router.get("/by-match/{match_id}", response_model=DatePlanResponse)
async def get_plan_by_match(match_id: UUID, db: db_dependency, current_user: CurrentUser):
    match = _get_match_or_404(db, match_id)
    _assert_match_member(match, current_user.id)
    plan = (
        db.query(DatePlanModel)
        .filter(DatePlanModel.match_id == match_id)
        .order_by(DatePlanModel.created_at.desc())
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="No date plan for this match")
    return _serialize_plan(db, plan, current_user.id)


@router.get("/{plan_id}", response_model=DatePlanResponse)
async def get_plan(plan_id: UUID, db: db_dependency, current_user: CurrentUser):
    plan = db.query(DatePlanModel).filter(DatePlanModel.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    match = _get_match_or_404(db, plan.match_id)
    _assert_match_member(match, current_user.id)
    return _serialize_plan(db, plan, current_user.id)


@router.post("/{plan_id}/availability", response_model=DatePlanResponse)
async def submit_availability(
    plan_id: UUID,
    payload: SubmitAvailabilityRequest,
    background_tasks: BackgroundTasks,
    db: db_dependency,
    current_user: CurrentUser,
):
    _rate_limit(str(current_user.id), "availability", 10)

    plan = db.query(DatePlanModel).filter(DatePlanModel.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    match = _get_match_or_404(db, plan.match_id)
    _assert_match_member(match, current_user.id)

    slot = TimeSlot(payload.available_date, payload.start_time, payload.end_time)
    err = validate_slot(slot)
    if err:
        raise HTTPException(status_code=422, detail=err)

    existing = (
        db.query(DatePlanAvailabilityModel)
        .filter(
            DatePlanAvailabilityModel.date_plan_id == plan.id,
            DatePlanAvailabilityModel.user_id == current_user.id,
        )
        .first()
    )
    if existing:
        existing.available_date = payload.available_date
        existing.start_time = payload.start_time
        existing.end_time = payload.end_time
        existing.timezone = payload.timezone
        db.add(existing)
    else:
        db.add(
            DatePlanAvailabilityModel(
                date_plan_id=plan.id,
                user_id=current_user.id,
                available_date=payload.available_date,
                start_time=payload.start_time,
                end_time=payload.end_time,
                timezone=payload.timezone,
            )
        )

    rows = (
        db.query(DatePlanAvailabilityModel)
        .filter(DatePlanAvailabilityModel.date_plan_id == plan.id)
        .all()
    )
    # Include the just-written row after flush
    db.flush()
    rows = (
        db.query(DatePlanAvailabilityModel)
        .filter(DatePlanAvailabilityModel.date_plan_id == plan.id)
        .all()
    )

    if len(rows) < 2:
        plan.status = "waiting_partner"
        plan.overlap_date = None
        plan.overlap_start = None
        plan.overlap_end = None
        plan.meeting_time = None
        db.add(plan)
        _persist_system_message(
            db,
            plan.chat_room_id,
            "Waiting for your match to submit their availability.",
            {"event": "availability_submitted", "plan_id": str(plan.id)},
        )
        db.commit()
        db.refresh(plan)
        resp = _serialize_plan(db, plan, current_user.id)
        await _broadcast_plan_event(
            plan.chat_room_id,
            "availability_submitted",
            resp.model_dump(mode="json"),
        )
        return resp

    # Both submitted — compute overlap
    by_user = {r.user_id: r for r in rows}
    a = by_user[match.creator_id]
    b = by_user[match.participant_id]
    result = compute_overlap(
        TimeSlot(a.available_date, a.start_time, a.end_time),
        TimeSlot(b.available_date, b.start_time, b.end_time),
    )

    if result.has_overlap:
        plan.status = "overlap_found"
        plan.overlap_date = result.overlap_date
        plan.overlap_start = result.overlap_start
        plan.overlap_end = result.overlap_end
        plan.meeting_time = result.meeting_time
        plan.confirmed_at = datetime.utcnow()
        plan.ranking_payload = None
        db.add(plan)
        _persist_system_message(
            db,
            plan.chat_room_id,
            f"Date confirmed — {result.overlap_date} at {result.meeting_time.strftime('%I:%M %p')}.",
            {"event": "overlap_found", "plan_id": str(plan.id)},
        )
        db.commit()
        db.refresh(plan)
        resp = _serialize_plan(db, plan, current_user.id)
        await _broadcast_plan_event(plan.chat_room_id, "overlap_found", resp.model_dump(mode="json"))
        # Kick off recommendation in background
        background_tasks.add_task(_bg_recommend, plan.id)
        return resp

    # No overlap — store suggestion (method B) for user choice
    suggested = {
        "date": result.suggested_date.isoformat(),
        "start_time": result.suggested_start.strftime("%H:%M:%S"),
        "end_time": result.suggested_end.strftime("%H:%M:%S"),
        "meeting_time": result.suggested_meeting_time.strftime("%H:%M:%S"),
        "rationale": result.rationale,
    }
    plan.status = "no_overlap"
    plan.overlap_date = None
    plan.overlap_start = None
    plan.overlap_end = None
    plan.meeting_time = None
    plan.ranking_payload = {"suggested": suggested}
    db.add(plan)
    _persist_system_message(
        db,
        plan.chat_room_id,
        "No matching availability found. Review the suggested midpoint time or edit availability.",
        {"event": "no_overlap", "plan_id": str(plan.id), "suggested": suggested},
    )
    db.commit()
    db.refresh(plan)
    resp = _serialize_plan(db, plan, current_user.id)
    await _broadcast_plan_event(plan.chat_room_id, "no_overlap", resp.model_dump(mode="json"))
    return resp


async def _bg_recommend(plan_id: UUID) -> None:
    from src.database.connection import SessionLocal

    db = SessionLocal()
    try:
        plan = db.query(DatePlanModel).filter(DatePlanModel.id == plan_id).first()
        if not plan:
            return
        plan = await run_recommendation(db, plan)
        resp_payload = {
            "plan_id": str(plan.id),
            "status": plan.status,
            "candidate_count": len(plan.candidate_snapshot or []),
        }
        if plan.chat_room_id:
            _persist_system_message(
                db,
                plan.chat_room_id,
                "Restaurant recommendation ready."
                if plan.status == "restaurant_ready"
                else "No suitable restaurant found.",
                {"event": "restaurant_ready", **resp_payload},
            )
            db.commit()
        await _broadcast_plan_event(plan.chat_room_id, "restaurant_ready", resp_payload)
    except Exception as exc:
        logger.exception("Background recommend failed: %s", exc)
    finally:
        db.close()


@router.post("/{plan_id}/accept-suggestion", response_model=DatePlanResponse)
async def accept_suggestion(
    plan_id: UUID,
    payload: AcceptSuggestionRequest,
    background_tasks: BackgroundTasks,
    db: db_dependency,
    current_user: CurrentUser,
):
    """Accept method-B midpoint suggestion when no overlap."""
    plan = db.query(DatePlanModel).filter(DatePlanModel.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    match = _get_match_or_404(db, plan.match_id)
    _assert_match_member(match, current_user.id)

    if plan.status != "no_overlap" or not plan.ranking_payload or not plan.ranking_payload.get("suggested"):
        raise HTTPException(status_code=400, detail="No suggestion to accept")

    if not payload.accept:
        return _serialize_plan(db, plan, current_user.id)

    s = plan.ranking_payload["suggested"]
    from datetime import date, time

    plan.overlap_date = date.fromisoformat(s["date"])
    plan.overlap_start = time.fromisoformat(s["start_time"])
    plan.overlap_end = time.fromisoformat(s["end_time"])
    plan.meeting_time = time.fromisoformat(s["meeting_time"])
    plan.status = "overlap_found"
    plan.suggestion_accepted = True
    plan.confirmed_at = datetime.utcnow()
    db.add(plan)
    _persist_system_message(
        db,
        plan.chat_room_id,
        f"Suggested time accepted — {plan.overlap_date} at {plan.meeting_time.strftime('%I:%M %p')}.",
        {"event": "overlap_found", "plan_id": str(plan.id)},
    )
    db.commit()
    db.refresh(plan)
    resp = _serialize_plan(db, plan, current_user.id)
    await _broadcast_plan_event(plan.chat_room_id, "overlap_found", resp.model_dump(mode="json"))
    background_tasks.add_task(_bg_recommend, plan.id)
    return resp


@router.post("/{plan_id}/recommend", response_model=DatePlanResponse)
async def recommend(plan_id: UUID, db: db_dependency, current_user: CurrentUser):
    _rate_limit(str(current_user.id), "recommend", 3)
    plan = db.query(DatePlanModel).filter(DatePlanModel.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    match = _get_match_or_404(db, plan.match_id)
    _assert_match_member(match, current_user.id)
    if plan.status not in ("overlap_found", "recommending", "restaurant_ready"):
        raise HTTPException(status_code=400, detail="Overlap must be confirmed first")
    plan = await run_recommendation(db, plan)
    resp = _serialize_plan(db, plan, current_user.id)
    await _broadcast_plan_event(plan.chat_room_id, "restaurant_ready", resp.model_dump(mode="json"))
    return resp


@router.post("/{plan_id}/next-restaurant", response_model=DatePlanResponse)
async def next_restaurant(
    plan_id: UUID,
    payload: NextRestaurantRequest,
    db: db_dependency,
    current_user: CurrentUser,
):
    _rate_limit(str(current_user.id), "next-restaurant", 10)
    plan = db.query(DatePlanModel).filter(DatePlanModel.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    match = _get_match_or_404(db, plan.match_id)
    _assert_match_member(match, current_user.id)
    if payload.version is not None and payload.version != plan.version:
        raise HTTPException(status_code=409, detail="Plan version conflict — refresh and retry")
    if not plan.candidate_snapshot:
        raise HTTPException(status_code=400, detail="No cached restaurants — run recommend first")
    plan = await cycle_next_restaurant(db, plan)
    resp = _serialize_plan(db, plan, current_user.id)
    await _broadcast_plan_event(plan.chat_room_id, "restaurant_cycled", resp.model_dump(mode="json"))
    return resp


@router.post("/{plan_id}/accept", response_model=DatePlanResponse)
async def accept_plan(plan_id: UUID, db: db_dependency, current_user: CurrentUser):
    plan = db.query(DatePlanModel).filter(DatePlanModel.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    match = _get_match_or_404(db, plan.match_id)
    _assert_match_member(match, current_user.id)
    if plan.status not in ("restaurant_ready", "accepted"):
        raise HTTPException(status_code=400, detail="No restaurant plan to accept")

    accepted = list(plan.accepted_by or [])
    if current_user.id not in accepted:
        accepted.append(current_user.id)
    plan.accepted_by = accepted

    members = {match.creator_id, match.participant_id}
    if members.issubset(set(accepted)):
        plan.status = "accepted"
        _persist_system_message(
            db,
            plan.chat_room_id,
            "Both of you accepted the food date plan!",
            {"event": "date_confirmed", "plan_id": str(plan.id)},
        )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    resp = _serialize_plan(db, plan, current_user.id)
    event = "date_confirmed" if plan.status == "accepted" else "plan_accepted"
    await _broadcast_plan_event(plan.chat_room_id, event, resp.model_dump(mode="json"))
    return resp


@router.post("/{plan_id}/cancel", response_model=DatePlanResponse)
async def cancel_plan(plan_id: UUID, db: db_dependency, current_user: CurrentUser):
    plan = db.query(DatePlanModel).filter(DatePlanModel.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    match = _get_match_or_404(db, plan.match_id)
    _assert_match_member(match, current_user.id)
    plan.status = "cancelled"
    db.add(plan)
    _persist_system_message(
        db,
        plan.chat_room_id,
        "Food date plan cancelled.",
        {"event": "plan_cancelled", "plan_id": str(plan.id)},
    )
    db.commit()
    db.refresh(plan)
    resp = _serialize_plan(db, plan, current_user.id)
    await _broadcast_plan_event(plan.chat_room_id, "plan_cancelled", resp.model_dump(mode="json"))
    return resp
