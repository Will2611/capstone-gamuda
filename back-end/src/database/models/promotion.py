from src.database.connection import Base
from sqlalchemy import String, Date, Time, Boolean, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, MappedAsDataclass
from sqlalchemy.dialects.postgresql import UUID
from datetime import date, time, datetime
from typing import Optional
import uuid

class KwOnlyMixin(MappedAsDataclass, kw_only=True):
    pass

class PromotionModel(KwOnlyMixin, Base):
    __tablename__ = "promotions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default_factory=uuid.uuid4)
    promo_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    restaurant_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=True, default=None)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    image_url: Mapped[str] = mapped_column(String, nullable=False)
    website_url: Mapped[str] = mapped_column(String, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True, default=None)
    end_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True, default=None)
    is_all_day: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(String, default="DRAFT", nullable=False)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, server_default=func.now(), default=None)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, server_default=func.now(), server_onupdate=func.now(), default=None)