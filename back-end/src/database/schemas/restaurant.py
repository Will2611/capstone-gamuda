from pydantic import BaseModel, Field


class RestaurantResponse(BaseModel):
    id: int
    name: str
    rating: float
    distance: str
    dietary: str
    cuisine: str
    isOpen: bool
    type: str
    coordinates: list[float]
    image: str | None = None

    model_config = {"from_attributes": True}


class RestaurantSearchParams(BaseModel):
    cuisine: str | None = None
    dietary: str | None = None
    price_range: str | None = None
    ambience: str | None = None
    time: str | None = None
    query: str | None = None


class SearchPreferencesSchema(BaseModel):
    cuisine: str = ""
    priceRange: str = ""
    dietary: str = ""
    distance: str = ""
    ambience: str = ""
    time: str = ""


class SearchHistoryCreate(BaseModel):
    query: str
    preferences: SearchPreferencesSchema = Field(default_factory=SearchPreferencesSchema)


class SearchHistoryResponse(BaseModel):
    id: str
    query: str
    date: str
    preferences: SearchPreferencesSchema
