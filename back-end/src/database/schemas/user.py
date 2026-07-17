from src.database.connection import Base
# types
from sqlalchemy import String, ForeignKey,Uuid, Float
# functions
from sqlalchemy import CheckConstraint,func
from uuid_utils.compat import UUID, uuid7
from sqlalchemy.orm import mapped_column, Mapped
from pydantic import Field, EmailStr, BaseModel, Field, EmailStr, ConfigDict
from pydantic.alias_generators import to_camel
from typing import Literal, Optional
from .base_model import DBBaseRequest
import pygeohash as gh
from enum import Enum
from typing import Literal, Optional, List
import datetime
from enum import Enum

class UserRequest(DBBaseRequest):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )

    full_name: str= Field(min_length=3, max_length=256)
    email:EmailStr = Field()
    password: str = Field(..., min_length=8)
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

# Nested structure to perfectly match frontend state
class ClientPreferencesSchema(BaseModel):
    cuisine: List[str] = []
    priceRange: List[str] = []
    dietary: List[str] = []
    distance: Optional[str] = ""
    ambience: List[str] = []
    time: Optional[str] = ""

# Dedicated schema for Client Registration
class ClientRegisterRequest(UserRequest):
    user_type: Literal['client'] = "client"
    gender: str
    birthday: datetime.date 
    religion: str
    language: str
    personalities: List[str] = Field(default=[])
    preferences: ClientPreferencesSchema
    profile_image: Optional[str] = Field(None)
