"""Food Match API — nearby discover, likes, real match + chat room IDs."""
from __future__ import annotations

import datetime
import logging
import os
from uuid import UUID

import proximityhash
import pygeohash as gh
from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func

from src.database.connection import db_dependency
from src.database.controllers.utils import CurrentUser
from src.database.models.chat import ChatRoomModel
from src.database.models.date_plan import DatePlanAvailabilityModel, DatePlanModel
from src.database.models.personal_connection import (
    BaseConnectionModel,
    FoodLikeModel,
    FoodMatchModel,
)
from src.database.models.user import ClientModel, UserModel
from src.database.schemas.date_plan import (
    DiscoverMatchUser,
    DiscoverResponse,
    EnsureMatchRequest,
    EnsureMatchResponse,
    FoodMatchListItem,
    FoodMatchListResponse,
    LikeRequest,
    LikeResponse,
    LocationUpdateRequest,
    PassRequest,
)
from src.llm.service import calculate_haversine_distance

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/food-match", tags=["food-match"])

DISCOVER_RADIUS_KM = float(os.getenv("DATE_PLAN_RADIUS_KM", "10"))
GEOHASH_PRECISION = 5


def _demo_email(participant_id: str) -> str:
    safe = participant_id.replace("@", "_").replace(" ", "")[:64]
    return f"demo+{safe}@bitescouts.local"


def _set_client_location(client: ClientModel, latitude: float, longitude: float, *, visible: bool = True) -> None:
    client.recent_latitude = latitude
    client.recent_longitude = longitude
    client.recent_geohash = gh.encode(latitude, longitude)
    if visible:
        client.visibility = True


def _age_from_birth(birth_date: datetime.date | None) -> int:
    if not birth_date:
        return 0
    today = datetime.date.today()
    years = today.year - birth_date.year
    if (today.month, today.day) < (birth_date.month, birth_date.day):
        years -= 1
    return max(0, years)


def _client_to_discover_user(
    client: ClientModel,
    *,
    distance_km: float | None = None,
) -> DiscoverMatchUser:
    foods = list(client.cuisine or [])
    tags = list(client.food_personality or [])
    bio_bits = []
    if foods:
        bio_bits.append(f"Into {', '.join(foods[:3])}")
    if tags:
        bio_bits.append(", ".join(tags[:2]))
    bio = ". ".join(bio_bits) if bio_bits else "Looking for a food buddy nearby."
    return DiscoverMatchUser(
        id=client.id,
        name=client.full_name or "Food Buddy",
        age=_age_from_birth(client.birth_date),
        avatarUrl=client.avatar_url,
        bio=bio,
        favoriteFoods=foods,
        favoriteRestaurants=[],
        personalityTags=tags,
        lookingFor="food-buddy",
        distanceKm=round(distance_km, 2) if distance_km is not None else None,
    )


def _require_client(db, current_user) -> ClientModel:
    if current_user.user_type != "client":
        raise HTTPException(status_code=403, detail="Only clients can use Food Match")
    me = db.query(ClientModel).filter(ClientModel.id == current_user.id).first()
    if not me:
        raise HTTPException(status_code=400, detail="Client profile required")
    return me


def _find_existing_match(db, a_id: UUID, b_id: UUID) -> FoodMatchModel | None:
    return (
        db.query(FoodMatchModel)
        .filter(
            (
                (FoodMatchModel.creator_id == a_id)
                & (FoodMatchModel.participant_id == b_id)
            )
            | (
                (FoodMatchModel.creator_id == b_id)
                & (FoodMatchModel.participant_id == a_id)
            )
        )
        .first()
    )


def _create_or_get_connected_match(
    db, me: ClientModel, partner: ClientModel
) -> tuple[FoodMatchModel, UUID, bool]:
    """Return (match, chat_room_id, is_new)."""
    existing = _find_existing_match(db, me.id, partner.id)
    if existing and existing.chat_room_id:
        existing.is_connected = True
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing, existing.chat_room_id, False

    room = ChatRoomModel(
        creator_id=me.id,
        participants_id=[me.id, partner.id],
        chat_type="human_casual",
        room_status="active",
        chat_name=f"{me.full_name} & {partner.full_name}",
        chat_caption="Food Match chat",
    )
    db.add(room)
    db.flush()

    if existing:
        existing.chat_room_id = room.id
        existing.is_connected = True
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing, room.id, False

    match = FoodMatchModel(
        connection_type="match",
        creator_id=me.id,
        participant_id=partner.id,
        is_connected=True,
    )
    match.chat_room_id = room.id
    db.add(match)
    db.commit()
    db.refresh(match)
    return match, room.id, True


def _ensure_demo_participant(db, participant) -> ClientModel:
    """Find or create a lightweight client for mock Food Match partners."""
    try:
        pid = UUID(str(participant.id))
        existing = db.query(ClientModel).filter(ClientModel.id == pid).first()
        if existing:
            return existing
    except ValueError:
        pid = None

    email = _demo_email(str(participant.id))
    by_email = db.query(UserModel).filter(UserModel.email == email).first()
    if by_email:
        client = db.query(ClientModel).filter(ClientModel.id == by_email.id).first()
        if client:
            return client

    client = ClientModel(
        full_name=participant.name or "Food Buddy",
        email=email,
        hashedPassword=UserModel.hash_password("demo-partner-not-login"),
        user_type="client",
        gender="unspecified",
        religion="unspecified",
        language="en",
        avatar_url=participant.avatarUrl,
        food_personality=list(participant.personalityTags or []),
        cuisine=list(participant.favoriteFoods or []),
        dietary=[],
        ambience=[],
        preferred_vibes=[],
        price_limit=[],
        distance_limit=10.0,
        visibility=False,
    )
    db.add(client)
    db.flush()
    return client


@router.post("/location")
async def update_location(
    payload: LocationUpdateRequest,
    db: db_dependency,
    current_user: CurrentUser,
):
    client = _require_client(db, current_user)
    _set_client_location(client, payload.latitude, payload.longitude, visible=True)
    db.add(client)
    db.commit()
    return {
        "status": "ok",
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "geohash": client.recent_geohash,
        "geohash_prefix": (client.recent_geohash or "")[:GEOHASH_PRECISION] or None,
    }


@router.get("/discover", response_model=DiscoverResponse)
async def discover_nearby(
    db: db_dependency,
    current_user: CurrentUser,
    radius_km: float = Query(default=DISCOVER_RADIUS_KM, ge=1, le=50),
):
    """Nearby-only discover using precision-5 geohash cells + haversine."""
    me = _require_client(db, current_user)

    if me.recent_latitude is None or me.recent_longitude is None:
        return DiscoverResponse(
            users=[],
            radius_km=radius_km,
            geohash_prefix=None,
            message="Enable location to discover food buddies nearby.",
        )

    if not me.recent_geohash:
        me.recent_geohash = gh.encode(me.recent_latitude, me.recent_longitude)
        db.add(me)
        db.commit()

    hashes_str = proximityhash.create_geohash(
        me.recent_latitude,
        me.recent_longitude,
        radius_km * 1000,
        GEOHASH_PRECISION,
    )
    geohash_list = [h for h in hashes_str.split(",") if h]
    prefix = (me.recent_geohash or "")[:GEOHASH_PRECISION]

    liked_ids = {
        row.liked_id
        for row in db.query(FoodLikeModel.liked_id)
        .filter(FoodLikeModel.liker_id == me.id)
        .all()
    }
    matched_ids: set[UUID] = set()
    for m in (
        db.query(FoodMatchModel)
        .filter(
            (FoodMatchModel.creator_id == me.id)
            | (FoodMatchModel.participant_id == me.id)
        )
        .all()
    ):
        matched_ids.add(m.creator_id)
        matched_ids.add(m.participant_id)
    matched_ids.discard(me.id)

    exclude = liked_ids | matched_ids | {me.id}

    query = db.query(ClientModel).filter(
        ClientModel.visibility.is_(True),
        ClientModel.recent_geohash.isnot(None),
        func.substr(ClientModel.recent_geohash, 1, GEOHASH_PRECISION).in_(geohash_list),
    )
    if exclude:
        query = query.filter(ClientModel.id.notin_(exclude))
    candidates = query.all()

    users: list[DiscoverMatchUser] = []
    for c in candidates:
        if c.recent_latitude is None or c.recent_longitude is None:
            continue
        dist = calculate_haversine_distance(
            me.recent_latitude,
            me.recent_longitude,
            c.recent_latitude,
            c.recent_longitude,
        )
        if dist > radius_km:
            continue
        users.append(_client_to_discover_user(c, distance_km=dist))

    users.sort(key=lambda u: u.distanceKm if u.distanceKm is not None else 999)

    return DiscoverResponse(
        users=users,
        radius_km=radius_km,
        geohash_prefix=prefix,
        message=None if users else "No food buddies nearby right now. Try again later.",
    )


@router.post("/like", response_model=LikeResponse)
async def like_user(
    payload: LikeRequest,
    db: db_dependency,
    current_user: CurrentUser,
):
    me = _require_client(db, current_user)
    if payload.user_id == me.id:
        raise HTTPException(status_code=400, detail="Cannot like yourself")

    partner = db.query(ClientModel).filter(ClientModel.id == payload.user_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="User not found")

    existing_like = (
        db.query(FoodLikeModel)
        .filter(
            FoodLikeModel.liker_id == me.id,
            FoodLikeModel.liked_id == partner.id,
        )
        .first()
    )
    if not existing_like:
        db.add(FoodLikeModel(liker_id=me.id, liked_id=partner.id))
        db.flush()

    reverse = (
        db.query(FoodLikeModel)
        .filter(
            FoodLikeModel.liker_id == partner.id,
            FoodLikeModel.liked_id == me.id,
        )
        .first()
    )
    if not reverse:
        db.commit()
        return LikeResponse(
            matched=False,
            message="Like saved. Waiting for them to like you back.",
        )

    match, chat_room_id, is_new = _create_or_get_connected_match(db, me, partner)
    return LikeResponse(
        matched=True,
        match_id=match.id,
        chat_room_id=chat_room_id,
        participant_id=partner.id,
        participant=_client_to_discover_user(partner),
        message="It's a match!" if is_new else "You're already matched.",
    )


@router.post("/pass")
async def pass_user(
    payload: PassRequest,
    db: db_dependency,
    current_user: CurrentUser,
):
    """Record a pass as a like exclusion by storing no row — client tracks locally.
    Optionally record a like-skip via food_likes with a sentinel is not used;
    pass is local-only; this endpoint exists for future analytics.
    """
    me = _require_client(db, current_user)
    if payload.user_id == me.id:
        raise HTTPException(status_code=400, detail="Cannot pass yourself")
    partner = db.query(ClientModel).filter(ClientModel.id == payload.user_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "ok", "passed_id": str(payload.user_id)}


@router.get("/matches", response_model=FoodMatchListResponse)
async def list_matches(
    db: db_dependency,
    current_user: CurrentUser,
):
    me = _require_client(db, current_user)
    rows = (
        db.query(FoodMatchModel)
        .filter(
            (FoodMatchModel.creator_id == me.id)
            | (FoodMatchModel.participant_id == me.id)
        )
        .order_by(FoodMatchModel.created_at.desc())
        .all()
    )

    items: list[FoodMatchListItem] = []
    for m in rows:
        partner_id = m.participant_id if m.creator_id == me.id else m.creator_id
        partner = db.query(ClientModel).filter(ClientModel.id == partner_id).first()
        if not partner:
            continue
        items.append(
            FoodMatchListItem(
                match_id=m.id,
                chat_room_id=m.chat_room_id,
                participant=_client_to_discover_user(partner),
                matched_at=m.created_at.isoformat() if m.created_at else None,
                is_connected=bool(m.is_connected),
            )
        )
    return FoodMatchListResponse(matches=items)


@router.delete("/matches")
async def clear_my_matches(
    db: db_dependency,
    current_user: CurrentUser,
):
    """Clear likes, matches, and date plans for the current user (dev/retest helper)."""
    me = _require_client(db, current_user)

    my_matches = (
        db.query(FoodMatchModel)
        .filter(
            (FoodMatchModel.creator_id == me.id)
            | (FoodMatchModel.participant_id == me.id)
        )
        .all()
    )
    match_ids = [m.id for m in my_matches]

    if match_ids:
        plan_ids = [
            p.id
            for p in db.query(DatePlanModel)
            .filter(DatePlanModel.match_id.in_(match_ids))
            .all()
        ]
        if plan_ids:
            db.query(DatePlanAvailabilityModel).filter(
                DatePlanAvailabilityModel.date_plan_id.in_(plan_ids)
            ).delete(synchronize_session=False)
            db.query(DatePlanModel).filter(DatePlanModel.id.in_(plan_ids)).delete(
                synchronize_session=False
            )

        db.query(FoodMatchModel).filter(FoodMatchModel.id.in_(match_ids)).delete(
            synchronize_session=False
        )
        db.query(BaseConnectionModel).filter(
            BaseConnectionModel.id.in_(match_ids)
        ).delete(synchronize_session=False)

    likes_deleted = (
        db.query(FoodLikeModel)
        .filter(
            (FoodLikeModel.liker_id == me.id) | (FoodLikeModel.liked_id == me.id)
        )
        .delete(synchronize_session=False)
    )

    db.commit()
    return {
        "status": "ok",
        "cleared_matches": len(match_ids),
        "cleared_likes": likes_deleted,
    }


@router.post("/ensure-match", response_model=EnsureMatchResponse)
async def ensure_match(
    payload: EnsureMatchRequest,
    db: db_dependency,
    current_user: CurrentUser,
):
    """
    Create (or return existing) FoodMatch + ChatRoom between the authenticated
    user and a participant (real client or demo shadow user).
    """
    me = _require_client(db, current_user)

    if payload.latitude is not None and payload.longitude is not None:
        _set_client_location(me, payload.latitude, payload.longitude, visible=True)
        db.add(me)

    partner = _ensure_demo_participant(db, payload.participant)

    # Give demo partners a location near the current user if missing
    if partner.recent_latitude is None and me.recent_latitude is not None:
        _set_client_location(
            partner,
            me.recent_latitude + 0.01,
            me.recent_longitude + 0.01,
            visible=False,
        )
        db.add(partner)

    match, chat_room_id, is_new = _create_or_get_connected_match(db, me, partner)
    return EnsureMatchResponse(
        match_id=match.id,
        chat_room_id=chat_room_id,
        participant_id=partner.id,
        is_new=is_new,
    )
