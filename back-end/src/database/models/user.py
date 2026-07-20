from src.database.connection import Base
# types
from sqlalchemy import String, ForeignKey,Uuid, Float, Boolean, Date, Time
from sqlalchemy.dialects.postgresql import ARRAY
# functions
from sqlalchemy import Index, text, CheckConstraint, and_, or_
import datetime
import uuid_utils.compat as uuid
from sqlalchemy.orm import mapped_column, Mapped
from pydantic import EmailStr
from typing import Literal, Optional, List
from .base_model import DBBaseModelTimeMixIn, DBBaseModelIdMixin, RestaurantDetailsTableMixin, GeohashHelper
import hashlib
import hmac
import os
from sqlalchemy.dialects.postgresql import ARRAY, TIME

class UserModel(DBBaseModelTimeMixIn, DBBaseModelIdMixin, Base):
    __tablename__ = 'users'

    user_type: Mapped[Literal["client", "owner"]] = mapped_column(String, nullable=False)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[EmailStr] = mapped_column(String, unique=True, index=True)
    hashedPassword: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String, nullable=True, default=None)

    # Add property aliases so Pydantic can automatically pull display_name and role
    @property
    def display_name(self) -> str:
        return self.full_name

    @property
    def role(self) -> str:
        return self.user_type

    @staticmethod
    def hash_password(password:str, salt:bytes|None=None, iterations=600000):
        if salt is None:
            salt = os.urandom(32)  # 256-bit salt
        password_hash = hashlib.pbkdf2_hmac(
            'sha256', 
            password.encode('utf-8'), 
            salt, 
            iterations, 
            dklen=32
        )
        return f"sha256_pbkdf2${salt.hex()}${password_hash.hex()}${iterations}"
        # return salt.hex(), password_hash.hex(), iterations

    @staticmethod
    def comparePasswords( stored_password:str, input:str):
        # algo for hashing type tracking
        _,salt,pw_hash,iters = stored_password.split('$',4)
        _,_,new_hash,_ = UserModel.hash_password(input,salt=bytes.fromhex(salt),iterations=int(iters)).split('$')
        return hmac.compare_digest(new_hash,pw_hash)
    

    __mapper_args__ = {'polymorphic_on': user_type}
    __table_args__=((
        CheckConstraint(
            user_type.in_(['client','owner']),
            name="cc_user_type",
            ),
    ))




class ClientModel(UserModel, RestaurantDetailsTableMixin, GeohashHelper):
    __tablename__ ='clients'
    # change to enum or whatever later, dependant on what is needed, is also considered subjective
    religion:Mapped[str] = mapped_column(String)
    language:Mapped[str] = mapped_column(String)
    gender:Mapped[Optional[str]]= mapped_column(String, nullable=True)
    birth_date:Mapped[Optional[datetime.date]]= mapped_column(Date,nullable=True)
    preferred_time: Mapped[Optional[str]] = mapped_column(String, nullable=True, default=None)
    preferred_vibes:Mapped[list[str]]= mapped_column(ARRAY(String), default_factory=list)
    price_limit:Mapped[List[str]] = mapped_column(ARRAY(String), default_factory=list)
    # Distance limit in km
    distance_limit:Mapped[float] = mapped_column(Float, default=5.0)
    visibility: Mapped[bool]= mapped_column(
        Boolean,
        nullable=False,
        default=False
    )
    food_personality:Mapped[Optional[list[str]]] = mapped_column(ARRAY(String),default=None)
    recent_longitude:Mapped[Optional[float]]=mapped_column(
        Float,
        default=None,
        nullable=True,
        )
    recent_latitude:Mapped[Optional[float]]=mapped_column(
        Float,
        default=None,
        nullable=True,
        )
    recent_geohash:Mapped[Optional[str]]= mapped_column(
        String(12),
        default=None,
        nullable=True,
        onupdate= GeohashHelper.column_geohash_factory(latitude_column="recent_latitude", longitude_column="recent_longitude")
        )
    favourites:Mapped[List[uuid.UUID]] = mapped_column(
        ARRAY(Uuid),
        default_factory=list
    )
    id:Mapped[uuid.UUID] = mapped_column(
        Uuid, 
        ForeignKey('users.id'),
        primary_key=True, 
        index=True, 
        init=False
        )
    
    
    #avatar_url:Mapped[Optional[str]]= mapped_column(String, default=None)

    __mapper_args__ = {
        'polymorphic_identity': 'client', 
        'inherit_condition': id == UserModel.id # Explicitly tell SQLAlchemy how to join
        }
    # Don't matter on overwrite, is just a quicker way of creating foreign key relation and taking advantage of ORM to load all other UserModel Data
    __table_args__=((
        Index(
            "ix_geohash_not_null",
            "recent_geohash",
            postgresql_where=text("recent_geohash IS NOT NULL")
        ),
        CheckConstraint(
            or_(
                visibility  ==False,
                and_(recent_latitude.is_not(None), recent_longitude.is_not(None))
                ),
            name="cc_geohash_if_visible",
            )
    ))
    



# Index(
#     "ix_geohash_not_null",
#     ClientModel.recent_geohash,
#     postgresql_where=text("recent_geohash IS NOT NULL")),  
  


# -- Counts every occurrence of every tag across the entire table
# SELECT element, COUNT(*) as total_count
# FROM unnest((SELECT array_agg(cuisine) FROM clients)) as element
# GROUP BY element
# ORDER BY total_count DESC;   
# -- Or the below query
# SELECT tag, COUNT(*) as frequency
# FROM users, unnest(cuisine) as tag
# GROUP BY tag
# ORDER BY frequency DESC;

# from sqlalchemy import func, select, distinct
# # from sqlalchemy.orm import Session

# # # 1. Create the subquery that unnests the array
# # # "tag" becomes the alias for the exploded elements
# unique_tag_query = (select(
#      func.unnest(ClientModel.cuisine).label('tag'))
#     .subquery())

# # 2. Query the subquery to group and count
# stmt = (
#     select(unnest_query.c.tag, func.count().label('frequency'))
#     .group_by(unnest_query.c.tag)
#     .order_by(func.count().desc())
# )

class OwnerModel(UserModel):
    __tablename__ = "owners"

    # Explicitly specify init=False here so dataclass constructor ignores 'id'
    id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
        init=False,
    )

    restaurant_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("restaurants.id"),
        nullable=True,
        index=True,
        default=None,
    )

    verified_owner: Mapped[bool] = mapped_column(Boolean, default=False)

    __mapper_args__ = {
        "polymorphic_identity": "owner",
        "inherit_condition": id == UserModel.id,
    }