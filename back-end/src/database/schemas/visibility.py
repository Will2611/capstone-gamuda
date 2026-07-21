from src.database.connection import Base
from sqlalchemy import String, Integer, Float, Date, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import mapped_column, Mapped, relationship
from datetime import date
from typing import Literal
from pydantic import BaseModel, Field
import uuid_utils.compat as uuid



# ---- ORM Models ----



# ---- Pydantic Response Schemas ----
FUNNEL_STAGES = ["Impressions", "Clicks", "Click-to-Direction"]
FUNNEL_STAGES_TYPE = Literal["Impressions", "Clicks", "Click-to-Direction"]

class VisibilityScoreEntry(BaseModel):
    value: float
    max: int = 100
    changeVsLastMonth: float
    trend: str  # "up" | "down" | "flat"

    model_config = {"from_attributes": True}


class AverageRatingEntry(BaseModel):
    value: float
    totalReviews: int
    source: str

    model_config = {"from_attributes": True}


class SocialEngagementEntry(BaseModel):
    value: float
    changeVsLastMonth: float
    trend: str

    model_config = {"from_attributes": True}


class RepeatVisitEntry(BaseModel):
    value: float
    changeVsLastMonth: float
    trend: str

    model_config = {"from_attributes": True}


class SummaryMetricsResponse(BaseModel):
    visibilityScore: VisibilityScoreEntry
    averageRating: AverageRatingEntry
    socialEngagementRate: SocialEngagementEntry
    repeatVisitRate: RepeatVisitEntry

    model_config = {"from_attributes": True}


class FunnelStageEntry(BaseModel):
    name: str
    count: int
    conversion: float
    isDropOff: bool

    model_config = {"from_attributes": True}


class FunnelMetricsResponse(BaseModel):
    stages: list[FunnelStageEntry]


class PlatformMetricEntry(BaseModel):
    label: str
    value: str

    model_config = {"from_attributes": True}


class SocialPlatformCardResponse(BaseModel):
    platform: str
    metrics: list[PlatformMetricEntry]
    url: str

    model_config = {"from_attributes": True}


class SocialVisibilityResponse(BaseModel):
    platforms: list[SocialPlatformCardResponse]


class ComplaintThemeEntry(BaseModel):
    theme: str
    count: int

    model_config = {"from_attributes": True}


class SentimentResponse(BaseModel):
    positivePct: float
    negativePct: float
    neutralPct: float
    complaintThemes: list[ComplaintThemeEntry]

    model_config = {"from_attributes": True}


class RestaurantListItemResponse(BaseModel):
    id: uuid.UUID
    name: str
    cuisines: str

    model_config = {"from_attributes": True}


class ReviewItemResponse(BaseModel):
    stars: int
    text: str
    matched: bool

    model_config = {"from_attributes": True}


class ReviewsByThemeResponse(BaseModel):
    theme: str
    totalNegative: int = 0
    matchedCount: int = 0
    reviews: list[ReviewItemResponse]


# ---- Foot Traffic ----

# ---- Pydantic Response Schemas ----

class HourlyTrafficItem(BaseModel):
    hour: int
    weekdayAvg: float
    weekendAvg: float

    model_config = {"from_attributes": True}


class TrafficInsightItem(BaseModel):
    id: str
    type: str
    title: str
    body: str
    linkedDayIndex: int | None = None
    linkedSegment: str | None = None

    model_config = {"from_attributes": True}


class StaffingShiftItem(BaseModel):
    day: str
    dayIndex: int
    date: str
    shift: str
    segment: str
    shiftStart: int
    shiftEnd: int
    expectedVisitors: int
    staffSuggested: int
    priority: str

    model_config = {"from_attributes": True}


class FootTrafficResponse(BaseModel):
    """Chart, insights, and forecast — all from foot_traffic_hourly in one response."""
    restaurantId: uuid.UUID
    hourly: list[HourlyTrafficItem]
    weekdayAvg: float = 0
    weekendAvg: float = 0
    weekdayTotal: int = 0
    weekendTotal: int = 0
    insights: list[TrafficInsightItem] = []
    nextWeekSchedule: list[StaffingShiftItem] = []
    updatedAt: str | None = None
    live: bool = False

    model_config = {"from_attributes": True}


# ------------ Action Suggestions ------------

class ActionSuggestion(BaseModel):
    issue: str
    impact: str
    recommendation: str

    model_config = {"from_attributes": True}


class ActionSuggestionsResponse(BaseModel):
    restaurantId: uuid.UUID
    suggestions: list[ActionSuggestion]

    model_config = {"from_attributes": True}
