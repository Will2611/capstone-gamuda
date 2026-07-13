from src.database.connection import Base
from sqlalchemy import String, Integer, Float, Date, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import mapped_column, Mapped, relationship
from datetime import date
from typing import Optional
from .base_model import DBBaseModelTimeMixIn

class RestaurantVisbilityModel(DBBaseModelTimeMixIn, Base):
    __tablename__ = "restaurants_measured"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True, init=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    cuisines: Mapped[str] = mapped_column(String(200), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)

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



class VisibilityMetricsModel(DBBaseModelTimeMixIn, Base):
    __tablename__ = "visibility_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, init=False)
    restaurant_id: Mapped[int] = mapped_column(Integer, ForeignKey("restaurants_measured.id"), nullable=False, index=True, init=False)
    recorded_at: Mapped[date] = mapped_column(Date, nullable=False)

    visibility_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    average_rating: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    total_reviews: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rating_source: Mapped[str] = mapped_column(String(50), nullable=False, default="Google")
    social_engagement_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    repeat_visit_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    restaurant: Mapped[Optional[RestaurantVisbilityModel]] = relationship("RestaurantVisbilityModel", back_populates="metrics", default=None)


class FunnelStageModel(DBBaseModelTimeMixIn, Base):
    __tablename__ = "funnel_stages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, init=False)
    restaurant_id: Mapped[int] = mapped_column(Integer, ForeignKey("restaurants_measured.id"), nullable=False, index=True, init=False)
    recorded_at: Mapped[date] = mapped_column(Date, nullable=False)

    stage_name: Mapped[str] = mapped_column(String(50), nullable=False)
    count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    conversion: Mapped[float] = mapped_column(Float, nullable=False, default=100.0)
    is_drop_off: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    restaurant: Mapped[Optional[RestaurantVisbilityModel]] = relationship("RestaurantVisbilityModel", back_populates="funnel_stages", default=None)


class SocialPlatformMetricsModel(DBBaseModelTimeMixIn, Base):
    __tablename__ = "social_platform_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, init=False)
    restaurant_id: Mapped[int] = mapped_column(Integer, ForeignKey("restaurants_measured.id"), nullable=False, index=True, init=False)
    recorded_at: Mapped[date] = mapped_column(Date, nullable=False)
    platform: Mapped[str] = mapped_column(String(20), nullable=False)
    avg_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_reviews: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    engagement_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    posts_this_month: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    restaurant: Mapped[Optional[RestaurantVisbilityModel]] = relationship(
        "RestaurantVisbilityModel", back_populates="social_platforms", default=None
    )

# Is best used for saving past-data
class SentimentDataModel(DBBaseModelTimeMixIn, Base):
    __tablename__ = "sentiment_data"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, init=False)
    restaurant_id: Mapped[int] = mapped_column(Integer, ForeignKey("restaurants_measured.id"), nullable=False, index=True, init=False)
    recorded_at: Mapped[date] = mapped_column(Date, nullable=False)
    restaurant_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    positive_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    negative_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    neutral_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    reviews: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    complaint_themes: Mapped[list["ComplaintThemeModel"]] = relationship(
        "ComplaintThemeModel", back_populates="sentiment", cascade="all, delete-orphan", default_factory=list
    )
    restaurant: Mapped[Optional[RestaurantVisbilityModel]] = relationship("RestaurantVisbilityModel", back_populates="sentiments", default=None)


class ComplaintThemeModel(DBBaseModelTimeMixIn, Base):
    __tablename__ = "complaint_themes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, init=False)
    sentiment_id: Mapped[int] = mapped_column(Integer, ForeignKey("sentiment_data.id"), nullable=False, index=True, init=False)
    theme: Mapped[str] = mapped_column(String(100), nullable=False)
    count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    sentiment: Mapped[Optional["SentimentDataModel"]] = relationship("SentimentDataModel", back_populates="complaint_themes", default=None)


class FootTrafficHourlyModel(DBBaseModelTimeMixIn, Base):
    __tablename__ = "foot_traffic_hourly"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, init=False)
    restaurant_id: Mapped[int] = mapped_column(Integer, ForeignKey("restaurants_measured.id"), nullable=False, index=True, init=False)
    traffic_date: Mapped[date] = mapped_column(Date, nullable=False)
    day_name: Mapped[str] = mapped_column(String(10), nullable=False)
    day_type: Mapped[str] = mapped_column(String(10), nullable=False)
    hour: Mapped[int] = mapped_column(Integer, nullable=False)
    visitors: Mapped[int] = mapped_column(Integer, nullable=False)

    restaurant: Mapped[Optional[RestaurantVisbilityModel]] = relationship("RestaurantVisbilityModel", default=None)


class FootTrafficDailyModel(DBBaseModelTimeMixIn, Base):
    __tablename__ = "foot_traffic_daily"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, init=False)
    restaurant_id: Mapped[int] = mapped_column(Integer, ForeignKey("restaurants_measured.id"), nullable=False, index=True, init=False)
    traffic_date: Mapped[date] = mapped_column(Date, nullable=False)
    day_name: Mapped[str] = mapped_column(String(10), nullable=False)
    day_type: Mapped[str] = mapped_column(String(10), nullable=False)
    visits: Mapped[int] = mapped_column(Integer, nullable=False)

    restaurant: Mapped[Optional[RestaurantVisbilityModel]] = relationship("RestaurantVisbilityModel", default=None)