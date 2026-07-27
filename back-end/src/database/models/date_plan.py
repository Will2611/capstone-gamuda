"""Date plan models for AI-powered food date planning."""
from __future__ import annotations

import datetime
from typing import List, Optional

import uuid_utils.compat as uuid
from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
    Uuid,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from src.database.connection import Base
from src.database.models.base_model import DBBaseModelIdMixin, DBBaseModelTimeMixIn

DATE_PLAN_STATUSES = (
    "draft",
    "waiting_partner",
    "no_overlap",
    "overlap_found",
    "recommending",
    "restaurant_ready",
    "accepted",
    "cancelled",
    "expired",
)


class DatePlanModel(DBBaseModelTimeMixIn, DBBaseModelIdMixin, Base):
    __tablename__ = "date_plans"

    match_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("matches.id"), nullable=False, index=True
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False, index=True
    )
    chat_room_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("chat_rooms.id"), nullable=True, index=True, default=None
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="draft")

    overlap_date: Mapped[Optional[datetime.date]] = mapped_column(Date, nullable=True, default=None)
    overlap_start: Mapped[Optional[datetime.time]] = mapped_column(Time, nullable=True, default=None)
    overlap_end: Mapped[Optional[datetime.time]] = mapped_column(Time, nullable=True, default=None)
    meeting_time: Mapped[Optional[datetime.time]] = mapped_column(Time, nullable=True, default=None)
    confirmed_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        DateTime, nullable=True, default=None
    )

    selected_restaurant_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("restaurants.id"), nullable=True, default=None
    )
    candidate_restaurant_ids: Mapped[List[uuid.UUID]] = mapped_column(
        ARRAY(Uuid), default_factory=list
    )
    candidate_index: Mapped[int] = mapped_column(Integer, default=0)
    ranking_payload: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True, default=None)
    date_ideas_payload: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True, default=None)
    candidate_snapshot: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True, default=None)

    accepted_by: Mapped[List[uuid.UUID]] = mapped_column(ARRAY(Uuid), default_factory=list)
    version: Mapped[int] = mapped_column(Integer, default=1)
    suggestion_accepted: Mapped[bool] = mapped_column(Boolean, default=False)


class DatePlanAvailabilityModel(DBBaseModelTimeMixIn, DBBaseModelIdMixin, Base):
    __tablename__ = "date_plan_availability"

    date_plan_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("date_plans.id"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False, index=True
    )
    available_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    start_time: Mapped[datetime.time] = mapped_column(Time, nullable=False)
    end_time: Mapped[datetime.time] = mapped_column(Time, nullable=False)
    timezone: Mapped[str] = mapped_column(String(64), default="Asia/Kuala_Lumpur")
