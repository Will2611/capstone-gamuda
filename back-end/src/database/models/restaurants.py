from src.database.connection import Base
from sqlalchemy import String,Float, Text, Time, Uuid, ForeignKey, Date, Boolean, Integer, Index
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy import CheckConstraint, or_, and_, func, cast
from sqlalchemy.orm import mapped_column, Mapped
from .base_model import DBBaseModelTimeMixIn, DBBaseModelIdMixin,RestaurantDetailsTableMixin, GeohashHelper
from typing import Optional, Literal, Dict, List, Tuple, Any
import datetime
from zoneinfo import ZoneInfo
import uuid_utils.compat as uuid

DAYS_OF_WEEK= [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
    ]
DAYS_OF_WEEK_TYPE= Literal[
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
    ]

from sqlalchemy import TypeDecorator
from src.database.schemas.base_model import OptionalCleansedTZStr


# Define your specific type structure for clarity
# Key: Day string (e.g., 'mon'), Value: List of (open_time, close_time) tuples
HoursType = Dict[DAYS_OF_WEEK_TYPE, List[Tuple[datetime.time, datetime.time]]]
DB_HoursType = Dict[DAYS_OF_WEEK_TYPE, list[list[str]]]

class OpeningHoursType(TypeDecorator):
    impl = JSONB
    cache_ok = True

    def process_bind_param(self, value: Optional[HoursType], dialect) -> Optional[DB_HoursType]:
        """Converts Python time objects to strings before saving to DB."""
        if value is None:
            return None
        
        processed:DB_HoursType = {}
        for day, shifts in value.items():
            # Convert list of tuples (time, time) to list of lists [str, str]
            processed[day] = [
                [t_start.strftime("%H:%M"), t_end.strftime("%H:%M")] 
                for t_start, t_end in shifts
            ]
        return processed

    def process_result_value(self, value: Optional[DB_HoursType], dialect) -> Optional[HoursType]:
        """Converts DB strings back to Python time objects."""
        if value is None:
            return None
        
        result = {}
        for day, shifts in value.items():
            # Convert list of lists [str, str] back to list of tuples (time, time)
            result[day] = [
                (datetime.time.fromisoformat(t_start), datetime.time.fromisoformat(t_end)) 
                for t_start, t_end in shifts
            ]
        return result   
class RestaurantModel(DBBaseModelTimeMixIn, DBBaseModelIdMixin,RestaurantDetailsTableMixin,GeohashHelper, Base):
    __tablename__ ='restaurants'
    name: Mapped[str]= mapped_column(String, nullable=False)
    longitude:Mapped[float]=mapped_column(Float, nullable=False)
    latitude:Mapped[float]=mapped_column(Float, nullable=False)
    about:Mapped[str] = mapped_column(Text, nullable=False)
    # In Minutes
    timezone_offset:Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    timezone:Mapped[OptionalCleansedTZStr] = mapped_column(String(64), nullable=True, default=None)
    rating: Mapped[Optional[float]]=mapped_column(Float, default=None)
    geohash:Mapped[str]= mapped_column(String(12),
                                       nullable=False,
                                       index=False,
                                       init=False,
                                       insert_default=GeohashHelper.column_geohash_factory()
                                       )
    # e.g.+6011-100-2999 becomes +60111002999
    contact_no:Mapped[Optional[str]] = mapped_column(String(20), nullable=True, default=None)
    # Set structure?, assume array with each index making into
    # may also make into seperated list, with dollar sign also?
    address:Mapped[list[str]] = mapped_column(ARRAY(String,zero_indexes=False, dimensions=1), nullable=True, default=None)



    opening_hours_struct:Mapped[HoursType] = mapped_column(OpeningHoursType, default_factory=dict)
    # Final opening hours into a struct
    source: Mapped[str] = mapped_column(String(20), default="seed")

    # Maybe change to remove column
    # Unique key for Google Places / SerpAPI upserts
    google_place_id:Mapped[Optional[str]]= mapped_column(String, unique=True, index=True, nullable=True, default=None)
    review_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=None)
    price_level: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=None)
    business_status: Mapped[Optional[str]] = mapped_column(String, nullable=True, default=None)
    website: Mapped[Optional[str]] = mapped_column(String, nullable=True, default=None)
    photos: Mapped[Optional[list[str]]] = mapped_column(ARRAY(String), nullable=True, default=None)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)
    __table_args__=((
        CheckConstraint(
            or_(
                timezone.is_not(None),
                timezone_offset.is_not(None)
                ),
            name="cc_timezone_or_offset",
            ),
            
            Index('idx_geo_5', func.substr(geohash, 1, 5)),
            Index('idx_geo_6', func.substr(geohash, 1, 6)),
            Index('idx_geo_7', func.substr(geohash, 1, 7)),
            Index('idx_geo_8', func.substr(geohash, 1, 8)),

    ))
    

    # override_is_openned:Mapped[bool|None] = mapped_column(Boolean,nullable=True)

class PromotionModel(DBBaseModelTimeMixIn, DBBaseModelIdMixin, Base):
    __tablename__ = "promotions"
    restaurant_id:Mapped[uuid.UUID] = mapped_column(
        Uuid, 
        ForeignKey('restaurants.id'),
        index=True, 
        init=False
        )
    title:Mapped[str]= mapped_column(String, nullable=False)
    description:Mapped[str]= mapped_column(Text, nullable=False)
    image_url:Mapped[str] = mapped_column(String, nullable=False)
    website_url:Mapped[str] = mapped_column(String, nullable=False)
    start_date: Mapped[datetime.date] = mapped_column(Date)
    end_date: Mapped[datetime.date] = mapped_column(Date)
    is_all_day:Mapped[bool] = mapped_column(Boolean)
    start_time:Mapped[datetime.time] = mapped_column(Time, nullable=True)
    end_time:Mapped[datetime.time] = mapped_column(Time, nullable=True)

    __table_args__=((
        CheckConstraint(
            or_(
                is_all_day ==True,
                and_(start_time.is_not(None), end_time.is_not(None))
                ),
            name="cc_all_day_or_time_limited",
            ),

    ))
