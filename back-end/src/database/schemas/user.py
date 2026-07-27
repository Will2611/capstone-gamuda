
# functions
from uuid_utils.compat import UUID

from pydantic import Field, EmailStr, BaseModel, Field, EmailStr, ConfigDict
from pydantic.alias_generators import to_camel
from typing import Literal, Optional
from .base_model import DBBaseRequest
from typing import Literal, Optional, List
import datetime

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

USER_ROLE_LIST = ["client","owner"]
USER_ROLE_TYPE = Literal["client","owner"]

class ClientRequest(UserRequest):
    # PreFill as default
    user_type:Literal['client'] = Field("client")# type: ignore[assignment]
    avatar_url:Optional[str] = Field(None)
    longitude:Optional[float]
    latitude:Optional[float]
    geohash:Optional[float]

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
    user_type: Literal['client'] = "client" # type: ignore[assignment]
    gender: str
    birthday: datetime.date 
    religion: str
    language: str
    personalities: List[str] = Field(default=[])
    preferences: ClientPreferencesSchema
    profile_image: Optional[str] = Field(None)

class ClientResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True  # Enables ORM conversion from ClientModel -> Pydantic
    )

    id: UUID
    full_name: str
    email: EmailStr
    user_type: Literal["client"]
    avatar_url: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[datetime.date] = None
    religion: Optional[str] = None
    language: Optional[str] = None
    food_personality: List[str] = []
    preferred_vibes: List[str] = []
    price_limit: List[str] = []
    distance_limit: Optional[float] = None
    preferred_time: Optional[str] = None
    recent_latitude: Optional[float] = None
    recent_longitude: Optional[float] = None
    geohash: Optional[str] = None

class SubscriptionKeys(BaseModel):
    p256dh:str
    auth:str
class UserSubscription(BaseModel):
    endpoint:str
    key:SubscriptionKeys