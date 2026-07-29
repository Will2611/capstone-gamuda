"""Tracker event API — capture Impression / Click / Visit for analytics waterfall."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from src.database.connection import db_dependency
from src.database.controllers.utils import CurrentUser
from src.database.models.restaurants import RestaurantModel
from src.database.models.trackers import TrackerModel
from src.database.schemas.trackers import TrackerCreateRequest, TrackerCreateResponse

router = APIRouter(prefix="/trackers", tags=["trackers"])


@router.post(
    "",
    response_model=TrackerCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_tracker(
    payload: TrackerCreateRequest,
    db: db_dependency,
    user: CurrentUser,
):
    """
    Record a user→restaurant interaction.

    Visit rows feed the nightly foot-traffic job → foot_traffic_hourly → dashboard chart,
    and getDemographics (unique clients who requested directions).
    Impression / Click are stored for funnel use later.
    """
    restaurant = (
        db.query(RestaurantModel.id)
        .filter(RestaurantModel.id == payload.restaurantId)
        .first()
    )
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        )

    row = TrackerModel(
        tracked_type=payload.trackedType,
        user_id=user.id,
        restaurant_id=payload.restaurantId,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    return TrackerCreateResponse(
        id=row.id,
        restaurantId=row.restaurant_id,
        trackedType=row.tracked_type,
        userId=row.user_id,
    )
