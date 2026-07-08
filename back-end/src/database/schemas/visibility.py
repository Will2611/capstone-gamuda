from src.database.connection import Base
from sqlalchemy import String, Integer, Float, Date, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import mapped_column, Mapped, relationship
from datetime import date
from typing import Optional
from pydantic import BaseModel, Field



# ---- ORM Models ----



# ---- Pydantic Response Schemas ----

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
    complaintThemes: list[ComplaintThemeEntry]

    model_config = {"from_attributes": True}


class RestaurantListItemResponse(BaseModel):
    id: int
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


class DailyTrafficSummary(BaseModel):
    weekdayAvg: float
    weekendAvg: float
    weekdayTotal: int
    weekendTotal: int

    model_config = {"from_attributes": True}


class FootTrafficResponse(BaseModel):
    restaurantId: int
    hourly: list[HourlyTrafficItem]
    daily: DailyTrafficSummary

    model_config = {"from_attributes": True}


# ------------ Action Suggestions ------------

class ActionSuggestion(BaseModel):
    issue: str
    impact: str
    recommendation: str

    model_config = {"from_attributes": True}


class ActionSuggestionsResponse(BaseModel):
    restaurantId: int
    suggestions: list[ActionSuggestion]

    model_config = {"from_attributes": True}
