from pydantic import BaseModel, EmailStr, Field, ConfigDict
from uuid import UUID
from typing import List, Optional

# --- USER & CLIENT SCHEMAS ---
class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    display_name: str = Field(min_length=2, max_length=120)
    role: str = Field(default="client", pattern="^(client|owner)$")
    phone: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    email: str
    displayName: str
    role: str
    avatarUrl: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUserResponse


# --- OWNER & RESTAURANT SCHEMAS ---
class AddressSchema(BaseModel):
    street: str
    postcode: str
    city: str
    state: str
    country: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class RestaurantRegistrationSchema(BaseModel):
    name: str
    contact_number: str
    website_url: Optional[str] = None
    images: List[str]
    cuisine_types: List[str]
    price_range: str
    ambience_vibes: List[str]
    dietary_needs: List[str]
    open_time: str
    close_time: str
    closed_days: List[str]
    address: AddressSchema


class OwnerRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    display_name: str = Field(min_length=2, max_length=120)
    role: str = "owner"
    profile_image: Optional[str] = None
    restaurant: RestaurantRegistrationSchema


class RegisterSuccessResponse(BaseModel):
    message: str
    user: AuthUserResponse