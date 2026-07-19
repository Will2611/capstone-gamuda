from pydantic import BaseModel, EmailStr, Field, ConfigDict
from uuid import UUID

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
    model_config = ConfigDict(from_attributes=True) # Enables ORM conversion compatibility
    
    id: UUID
    email: str
    display_name: str
    role: str
    avatar_url: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUserResponse
