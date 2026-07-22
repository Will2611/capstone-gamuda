"""Pydantic schemas for food date planning."""
from __future__ import annotations

from datetime import date, time
from typing import Any, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

DatePlanStatus = Literal[
    "draft",
    "waiting_partner",
    "no_overlap",
    "overlap_found",
    "recommending",
    "restaurant_ready",
    "accepted",
    "cancelled",
    "expired",
]


class AvailabilitySlot(BaseModel):
    available_date: date
    start_time: time
    end_time: time
    timezone: str = "Asia/Kuala_Lumpur"

    @field_validator("end_time")
    @classmethod
    def end_after_start(cls, v: time, info):
        start = info.data.get("start_time")
        if start and v <= start:
            raise ValueError("end_time must be after start_time")
        return v


class CreateDatePlanRequest(BaseModel):
    match_id: UUID


class SubmitAvailabilityRequest(AvailabilitySlot):
    accept_suggestion: bool = False


class AcceptSuggestionRequest(BaseModel):
    """Accept midpoint suggestion when no overlap (method B path)."""
    accept: bool = True


class NextRestaurantRequest(BaseModel):
    version: Optional[int] = None


class AvailabilityView(BaseModel):
    user_id: UUID
    available_date: date
    start_time: time
    end_time: time
    timezone: str


class OverlapView(BaseModel):
    date: date
    start_time: time
    end_time: time
    meeting_time: time


class SuggestedSlotView(BaseModel):
    date: date
    start_time: time
    end_time: time
    meeting_time: time
    rationale: str


class RestaurantCandidateView(BaseModel):
    id: UUID
    name: str
    cuisine: str
    rating: Optional[float] = None
    price_level: Optional[int] = None
    summary: Optional[str] = None
    photos: list[str] = Field(default_factory=list)
    address: Optional[str] = None
    distance_a_km: float
    distance_b_km: float
    travel_time_a_min: int
    travel_time_b_min: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class DateIdeasView(BaseModel):
    restaurant_name: str
    summary: str
    why_both: str
    conversation_starters: list[str] = Field(default_factory=list)
    ice_breakers: list[str] = Field(default_factory=list)
    fun_food_challenge: str = ""
    nearby_dessert: Optional[str] = None
    nearby_activity: Optional[str] = None
    estimated_budget: str = ""
    suggested_meeting_time: str = ""
    expected_duration: str = ""
    vibe: str = "Casual"


class DatePlanResponse(BaseModel):
    id: UUID
    match_id: UUID
    chat_room_id: Optional[UUID] = None
    status: DatePlanStatus
    created_by: UUID
    yours: Optional[AvailabilityView] = None
    theirs: Optional[AvailabilityView] = None
    overlap: Optional[OverlapView] = None
    suggested: Optional[SuggestedSlotView] = None
    recommendation: Optional[RestaurantCandidateView] = None
    date_ideas: Optional[DateIdeasView] = None
    ranking_reason: Optional[str] = None
    accepted_by: list[UUID] = Field(default_factory=list)
    candidate_index: int = 0
    candidate_count: int = 0
    version: int = 1
    message: Optional[str] = None


class EnsureMatchParticipant(BaseModel):
    id: str
    name: str
    age: Optional[int] = None
    avatarUrl: Optional[str] = None
    bio: Optional[str] = ""
    favoriteFoods: list[str] = Field(default_factory=list)
    personalityTags: list[str] = Field(default_factory=list)
    lookingFor: str = "food-buddy"


class EnsureMatchRequest(BaseModel):
    participant: EnsureMatchParticipant
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class EnsureMatchResponse(BaseModel):
    match_id: UUID
    chat_room_id: UUID
    participant_id: UUID
    is_new: bool


class LocationUpdateRequest(BaseModel):
    latitude: float
    longitude: float
