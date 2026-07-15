from src.database.connection import Base
from sqlalchemy import String,Float, Text, Time, Uuid, ForeignKey, Date, Boolean, Integer
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



# Define your specific type structure for clarity
# Key: Day string (e.g., 'mon'), Value: List of (open_time, close_time) tuples
HoursType = Dict[str, List[Tuple[datetime.time, datetime.time]]]

class OpeningHoursType(TypeDecorator):
    impl = JSONB
    cache_ok = True

    def process_bind_param(self, value: Optional[HoursType], dialect) -> Optional[Any]:
        """Converts Python time objects to strings before saving to DB."""
        if value is None:
            return None
        
        processed = {}
        for day, shifts in value.items():
            # Convert list of tuples (time, time) to list of lists [str, str]
            processed[day] = [
                [t_start.strftime("%H:%M"), t_end.strftime("%H:%M")] 
                for t_start, t_end in shifts
            ]
        return processed

    def process_result_value(self, value: Optional[Any], dialect) -> Optional[HoursType]:
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
    rating: Mapped[Optional[float]]=mapped_column(Float)
    longitude:Mapped[float]=mapped_column(Float, nullable=False)
    latitude:Mapped[float]=mapped_column(Float, nullable=False)
    geohash:Mapped[str]= mapped_column(String(12),
                                       nullable=False,
                                       index=True,
                                       init=False,
                                       insert_default=GeohashHelper.column_geohash_factory()
                                       )
    about:Mapped[str] = mapped_column(Text, nullable=False)
    # e.g.+6011-100-2999 becomes +60111002999
    contact_no:Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    # Set structure?, assume array with each index making into
    # may also make into seperated list, with dollar sign also?
    address:Mapped[list[str]] = mapped_column(ARRAY(String,zero_indexes=False, dimensions=1), nullable=True)

    # also a '$'separated list?
    # opening_hours:Mapped[str] = mapped_column(Text, nullable=False)
    # Alt
    # start_time: Mapped[Optional[datetime.time]] = mapped_column(Time, nullable=True)
    # close_time: Mapped[Optional[datetime.time]] = mapped_column(Time, nullable=True)
    # days_opened:Mapped[list[DAYS_OF_WEEK_TYPE]] = mapped_column(ARRAY(String(9)), nullable=False)
    timezone:Mapped[Optional[ZoneInfo]] = mapped_column(String(64), nullable=True)
    # In Minutes
    timezone_offset:Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    opening_hours_struct:Mapped[Dict[DAYS_OF_WEEK_TYPE,List[Tuple[datetime.time,datetime.time]]]] = mapped_column(OpeningHoursType, default_factory=dict)

    # Maybe change to remove column
    google_place_id:Mapped[Optional[str]]= mapped_column(String, nullable=True, default=None)
    __table_args__=((
        CheckConstraint(
            or_(
                timezone.is_not(None),
                timezone_offset.is_not(None)
                ),
            name="cc_timezone_or_offset",
            ),

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
