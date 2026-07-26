from src.database.connection import Base
from sqlalchemy import String, Integer, Float, Date, Boolean, ForeignKey, Text, JSON, Uuid
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import mapped_column, Mapped, relationship
from datetime import date
from typing import Optional
from .base_model import DBBaseModelTimeMixIn, DBBaseModelIdMixin
import uuid_utils.compat as uuid
from src.database.schemas.reviews import SENTIMENT_TYPE, SentimentModelValidation

class VisibilityMetricsModel(DBBaseModelTimeMixIn, DBBaseModelIdMixin, Base):
    __tablename__ = "visibility_metrics"

    # restaurant_id: Mapped[int] = mapped_column(Integer, ForeignKey("restaurants_measured.id"), nullable=False, index=True, init=False)
    restaurant_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("restaurants.id"), nullable=False, index=True)

    recorded_at: Mapped[date] = mapped_column(Date, nullable=False)

    visibility_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    average_rating: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    total_reviews: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rating_source: Mapped[str] = mapped_column(String(50), nullable=False, default="Google")
    social_engagement_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    repeat_visit_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)


class FunnelStageModel(DBBaseModelTimeMixIn,DBBaseModelIdMixin, Base):
    __tablename__ = "funnel_stages"

    # restaurant_id: Mapped[int] = mapped_column(Integer, ForeignKey("restaurants_measured.id"), nullable=False, index=True, init=False)
    restaurant_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("restaurants.id"), nullable=False, index=True)
    recorded_at: Mapped[date] = mapped_column(Date, nullable=False)

    stage_name: Mapped[str] = mapped_column(String(50), nullable=False)
    count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    conversion: Mapped[float] = mapped_column(Float, nullable=False, default=100.0)
    is_drop_off: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class SocialPlatformMetricsModel(DBBaseModelTimeMixIn, DBBaseModelIdMixin,Base):
    """This is used for reviews only for now, seed with fake google reviews"""
    __tablename__ = "social_platform_metrics"

    # restaurant_id: Mapped[int] = mapped_column(Integer, ForeignKey("restaurants_measured.id"), nullable=False, index=True, init=False)
    restaurant_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("restaurants.id"), nullable=False, index=True)
    recorded_at: Mapped[date] = mapped_column(Date, nullable=False)
    platform: Mapped[str] = mapped_column(String(20), nullable=False)
    avg_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_reviews: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    engagement_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    posts_this_month: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

# Is best used for saving past-data
class SentimentDataModel(DBBaseModelTimeMixIn, DBBaseModelIdMixin,Base):
    __tablename__ = "sentiment_data"

    restaurant_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("restaurants.id"), nullable=False, index=True)
    recorded_at: Mapped[date] = mapped_column(Date, nullable=False)
    positive_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    negative_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    neutral_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    mixed_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    reviews: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=None)


class ComplaintThemeModel(DBBaseModelTimeMixIn, Base, DBBaseModelIdMixin):
    """Getting deprecated, general structure is also useful for understanding all sentiment types"""
    __tablename__ = "complaint_themes"

    sentiment_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("sentiment_data.id"), nullable=False, index=True)
    theme: Mapped[str] = mapped_column(String(100), nullable=False)
    count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

class SentimentThemeModel(DBBaseModelTimeMixIn, Base, DBBaseModelIdMixin):
    __tablename__ = "sentiment_themes"

    sentiment_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("sentiment_data.id"), nullable=False, index=True)
    theme: Mapped[str] = mapped_column(String(100), nullable=False)
    sentiment_type:Mapped[SENTIMENT_TYPE] = mapped_column(String(25), nullable=False)

    review_ids:Mapped[list[uuid.UUID]] = mapped_column(ARRAY(Uuid),default_factory=list)
    count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class FootTrafficHourlyModel(DBBaseModelTimeMixIn, Base, DBBaseModelIdMixin):
    """Single foot-traffic table — bar chart and weekday/weekend stats derive from this."""
    __tablename__ = "foot_traffic_hourly"

    restaurant_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("restaurants.id"), nullable=False, index=True)
    traffic_date: Mapped[date] = mapped_column(Date, nullable=False)
    day_name: Mapped[str] = mapped_column(String(10), nullable=False)
    day_type: Mapped[str] = mapped_column(String(10), nullable=False)
    hour: Mapped[int] = mapped_column(Integer, nullable=False)
    visitors: Mapped[int] = mapped_column(Integer, nullable=False)
