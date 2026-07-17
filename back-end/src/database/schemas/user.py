from src.database.connection import Base
# types
from sqlalchemy import String, ForeignKey,Uuid, Float
# functions
from sqlalchemy import CheckConstraint,func
from uuid_utils.compat import UUID, uuid7
from sqlalchemy.orm import mapped_column, Mapped
from pydantic import Field, EmailStr
from typing import Literal, Optional
from .base_model import DBBaseRequest
import pygeohash as gh
from enum import Enum

class UserRequest(DBBaseRequest):
    full_name: str= Field(min_length=3, max_length=256)
    email:EmailStr = Field()
    user_type:Literal["client","owner"] = Field()

class UserTypeEnum(Enum):
    CLIENT ="client"
    OWNER = "owner"


class ClientRequest(UserRequest):
    # PreFill as default
    user_type:Literal['client'] = Field("client")# type: ignore[assignment]
    avatar_url:Optional[str] = Field(None)
    longitude:Optional[float]
    latitude:Optional[float]
    geohash:Optional[float]

def generate_geohash(context):
    current_param= context.get_current_parameters()
    recent_lat =  current_param.get('recent_latitude')
    recent_long =  current_param.get('recent_longitude')
    if recent_lat and recent_long:
        return gh.encode(latitude=current_param.get('recent_latitude'),longitude=current_param.get('recent_longitude') )
    return None

class OwnerRequest(UserRequest):
    # PreFill as default
    user_type:Literal['owner'] = Field("owner")# type: ignore[assignment]
    restaurant_name:str = Field()


