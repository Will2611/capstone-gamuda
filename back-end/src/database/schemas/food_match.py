from pydantic import BaseModel, Field


class FoodPreferenceProfileSchema(BaseModel):
    favoriteFoods: list[str] = Field(default_factory=list)
    personalityTags: list[str] = Field(default_factory=list)
    budgetRange: str = "moderate"
    halal: bool = False
    vegetarian: bool = False
    preferredDiningTime: str = "dinner"
    meetupDistance: str = "5km"
    profileComplete: bool = False
    profileVisible: bool = True


class MatchUserSchema(BaseModel):
    id: str
    name: str
    age: int
    avatarUrl: str
    bio: str
    favoriteFoods: list[str]
    favoriteRestaurants: list[str]
    personalityTags: list[str]
    lookingFor: str
    likesBack: bool | None = None


class LobbyCandidateSchema(BaseModel):
    user: MatchUserSchema
    score: int
    sharedInterests: list[str]


class FoodMatchSchema(BaseModel):
    id: str
    user: MatchUserSchema
    compatibilityScore: int
    sharedInterests: list[str]
    matchedAt: str
    chatExpiresAt: str
    saved: bool


class SwipeRequest(BaseModel):
    candidate_id: str
    action: str = Field(pattern="^(like|pass|save|block)$")


class ChatMessageSchema(BaseModel):
    id: str
    senderId: str
    text: str
    timestamp: str


class SendMessageRequest(BaseModel):
    text: str = Field(min_length=1, max_length=1000)


class SuggestedRestaurantSchema(BaseModel):
    id: int
    name: str
    cuisine: str
    rating: float
    distance: str
    image: str
    matchReason: str
