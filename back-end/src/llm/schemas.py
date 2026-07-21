from pydantic import BaseModel, Field
import uuid_utils.compat as uuid

class ChatTurn(BaseModel):
    role: str = Field(description="'user' or 'assistant'")
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatTurn]
    latitude: float | None = None
    longitude: float | None = None


class RestaurantResult(BaseModel):
    id: uuid.UUID | None = None
    name: str
    cuisine: str
    rating: float
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    review_count: int | None = None
    distance: float | None = None
    summary: str | None = None
    source: str | None = None


class ChatResponse(BaseModel):
    message: str
    restaurants: list[RestaurantResult] = []
    suggestions: list[str] = []
