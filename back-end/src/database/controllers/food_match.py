"""Food Match API — create real match + chat room IDs."""
from __future__ import annotations

import logging
from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from src.database.connection import db_dependency
from src.database.controllers.utils import CurrentUser
from src.database.models.chat import ChatRoomModel
from src.database.models.personal_connection import FoodMatchModel
from src.database.models.user import ClientModel, UserModel
from src.database.schemas.date_plan import (
    EnsureMatchRequest,
    EnsureMatchResponse,
    LocationUpdateRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/food-match", tags=["food-match"])


def _demo_email(participant_id: str) -> str:
    safe = participant_id.replace("@", "_").replace(" ", "")[:64]
    return f"demo+{safe}@bitescouts.local"


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
    if current_user.user_type != "client":
        raise HTTPException(status_code=403, detail="Only clients can create food matches")

    me = db.query(ClientModel).filter(ClientModel.id == current_user.id).first()
    if not me:
        raise HTTPException(status_code=400, detail="Client profile required")

    if payload.latitude is not None and payload.longitude is not None:
        me.recent_latitude = payload.latitude
        me.recent_longitude = payload.longitude
        me.visibility = True
        db.add(me)

    partner = _ensure_demo_participant(db, payload.participant)

    # Give demo partners a location near the current user if missing
    if partner.recent_latitude is None and me.recent_latitude is not None:
        partner.recent_latitude = me.recent_latitude + 0.01
        partner.recent_longitude = me.recent_longitude + 0.01
        db.add(partner)

    # Existing match either direction
    existing = (
        db.query(FoodMatchModel)
        .filter(
            (
                (FoodMatchModel.creator_id == me.id)
                & (FoodMatchModel.participant_id == partner.id)
            )
            | (
                (FoodMatchModel.creator_id == partner.id)
                & (FoodMatchModel.participant_id == me.id)
            )
        )
        .first()
    )
    if existing and existing.chat_room_id:
        existing.is_connected = True
        db.add(existing)
        db.commit()
        return EnsureMatchResponse(
            match_id=existing.id,
            chat_room_id=existing.chat_room_id,
            participant_id=partner.id,
            is_new=False,
        )

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
        return EnsureMatchResponse(
            match_id=existing.id,
            chat_room_id=room.id,
            participant_id=partner.id,
            is_new=False,
        )

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

    return EnsureMatchResponse(
        match_id=match.id,
        chat_room_id=room.id,
        participant_id=partner.id,
        is_new=True,
    )


@router.post("/location")
async def update_location(
    payload: LocationUpdateRequest,
    db: db_dependency,
    current_user: CurrentUser,
):
    client = db.query(ClientModel).filter(ClientModel.id == current_user.id).first()
    if not client:
        raise HTTPException(status_code=400, detail="Client profile required")
    client.recent_latitude = payload.latitude
    client.recent_longitude = payload.longitude
    client.visibility = True
    db.add(client)
    db.commit()
    return {"status": "ok", "latitude": payload.latitude, "longitude": payload.longitude}
