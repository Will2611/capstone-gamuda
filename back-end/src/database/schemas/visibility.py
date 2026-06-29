from src.database.connection import Base
from sqlalchemy import String, Integer, Float, Date, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import mapped_column, Mapped, relationship
from datetime import date
from typing import Optional
from pydantic import BaseModel, Field
from .base_model import DBBaseModelMixIn


# ─────────────────────── ORM Models ───────────────────────

class RestaurantModel(DBBaseModelMixIn, Base):
    __tablename__ = "restaurants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True, init=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    cuisines: Mapped[str] = mapped_column(String(200), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    sample_reviews: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    review_ratings: Mapped[Optional[list[int]]] = mapped_column(JSON, nullable=True)

    metrics: Mapped[list["VisibilityMetricsModel"]] = relationship(
        "VisibilityMetricsModel", back_populates="restaurant", cascade="all, delete-orphan", default_factory=list
    )
    funnel_stages: Mapped[list["FunnelStageModel"]] = relationship(
        "FunnelStageModel", back_populates="restaurant", cascade="all, delete-orphan", default_factory=list
    )
    social_platforms: Mapped[list["SocialPlatformMetricsModel"]] = relationship(
        "SocialPlatformMetricsModel", back_populates="restaurant", cascade="all, delete-orphan", default_factory=list
    )
    sentiments: Mapped[list["SentimentDataModel"]] = relationship(
        "SentimentDataModel", back_populates="restaurant", cascade="all, delete-orphan", default_factory=list
    )


class VisibilityMetricsModel(DBBaseModelMixIn, Base):
    __tablename__ = "visibility_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, init=False)
    restaurant_id: Mapped[int] = mapped_column(Integer, ForeignKey("restaurants.id"), nullable=False, index=True, init=False)
    recorded_at: Mapped[date] = mapped_column(Date, nullable=False)

    visibility_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    average_rating: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    total_reviews: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rating_source: Mapped[str] = mapped_column(String(50), nullable=False, default="Google")
    social_engagement_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    repeat_visit_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    restaurant: Mapped[Optional["RestaurantModel"]] = relationship("RestaurantModel", back_populates="metrics", default=None)


class FunnelStageModel(DBBaseModelMixIn, Base):
    __tablename__ = "funnel_stages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, init=False)
    restaurant_id: Mapped[int] = mapped_column(Integer, ForeignKey("restaurants.id"), nullable=False, index=True, init=False)
    recorded_at: Mapped[date] = mapped_column(Date, nullable=False)

    stage_name: Mapped[str] = mapped_column(String(50), nullable=False)
    count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    conversion: Mapped[float] = mapped_column(Float, nullable=False, default=100.0)
    is_drop_off: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    restaurant: Mapped[Optional["RestaurantModel"]] = relationship("RestaurantModel", back_populates="funnel_stages", default=None)


class SocialPlatformMetricsModel(DBBaseModelMixIn, Base):
    __tablename__ = "social_platform_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, init=False)
    restaurant_id: Mapped[int] = mapped_column(Integer, ForeignKey("restaurants.id"), nullable=False, index=True, init=False)
    recorded_at: Mapped[date] = mapped_column(Date, nullable=False)
    platform: Mapped[str] = mapped_column(String(20), nullable=False)
    avg_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_reviews: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    engagement_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    posts_this_month: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    restaurant: Mapped[Optional["RestaurantModel"]] = relationship(
        "RestaurantModel", back_populates="social_platforms", default=None
    )


class SentimentDataModel(DBBaseModelMixIn, Base):
    __tablename__ = "sentiment_data"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, init=False)
    restaurant_id: Mapped[int] = mapped_column(Integer, ForeignKey("restaurants.id"), nullable=False, index=True, init=False)
    recorded_at: Mapped[date] = mapped_column(Date, nullable=False)

    positive_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    negative_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    brand_awareness_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    brand_awareness_change: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    local_search_rank: Mapped[int] = mapped_column(Integer, nullable=False, default=50)
    search_rank_change: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    keyword_match_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    posts_per_week_avg: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    complaint_themes: Mapped[list["ComplaintThemeModel"]] = relationship(
        "ComplaintThemeModel", back_populates="sentiment", cascade="all, delete-orphan", default_factory=list
    )
    restaurant: Mapped[Optional["RestaurantModel"]] = relationship("RestaurantModel", back_populates="sentiments", default=None)


class ComplaintThemeModel(DBBaseModelMixIn, Base):
    __tablename__ = "complaint_themes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, init=False)
    sentiment_id: Mapped[int] = mapped_column(Integer, ForeignKey("sentiment_data.id"), nullable=False, index=True, init=False)
    theme: Mapped[str] = mapped_column(String(100), nullable=False)
    count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    sentiment: Mapped[Optional["SentimentDataModel"]] = relationship("SentimentDataModel", back_populates="complaint_themes", default=None)


# ───────────────── Pydantic Response Schemas ─────────────────

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
    brandAwarenessPct: float
    brandAwarenessChange: float
    localSearchRank: int
    searchRankChange: int
    keywordMatchRate: float
    postsPerWeekAvg: float
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
