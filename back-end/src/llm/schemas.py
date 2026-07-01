from pydantic import BaseModel, Field


class ChatTurn(BaseModel):
    role: str = Field(description="'user' or 'assistant'")
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatTurn]


class RestaurantResult(BaseModel):
    id: int
    name: str
    cuisine: str
    rating: float
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class ChatResponse(BaseModel):
    message: str
    restaurants: list[RestaurantResult] = []