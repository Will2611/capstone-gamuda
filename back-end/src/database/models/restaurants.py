from src.database.connection import Base
from sqlalchemy import String,Float, Text, ARRAY, Time, Uuid, ForeignKey, Date, Boolean
from sqlalchemy import CheckConstraint, or_, and_, func, cast
from sqlalchemy.orm import mapped_column, Mapped
from .base_model import DBBaseModelTimeMixIn, DBBaseModelIdMixin,RestaurantDetailsTableMixin, GeohashHelper
from typing import Optional, List, Literal
import datetime
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
class RestaurantModel(DBBaseModelTimeMixIn, DBBaseModelIdMixin,RestaurantDetailsTableMixin,GeohashHelper, Base):
    __tablename__ ='restaurants'
    restaurant_name: Mapped[str]= mapped_column(String, nullable=False)
    rating: Mapped[float]=mapped_column(Float)
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
    contact_no:Mapped[Optional[str]] = mapped_column(String(12), nullable=True)
    # Set structure?, assume array with each index making into
    # may also make into seperated list, with dollar sign also?
    address:Mapped[List[str]] = mapped_column(ARRAY(String,zero_indexes=False, dimensions=1), nullable=True)

    # also a '$'separated list?
    opening_hours:Mapped[str] = mapped_column(Text, nullable=False)
    # Alt
    start_time: Mapped[datetime.time] = mapped_column(Time, nullable=False)
    close_time:Mapped[datetime.time] = mapped_column(Time, nullable=False)
    timezone_offset:Mapped[float] = mapped_column(Float, nullable=False)
    days_opened:Mapped[List[DAYS_OF_WEEK_TYPE]] = mapped_column(ARRAY(String(9)), nullable=False)

    # Maybe change to remove column
    google_place_id:Mapped[Optional[str]]= mapped_column(String)
    

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
