from pydantic import BaseModel, Field

class DiningIntent(BaseModel):
    needs_restaurant_search: bool = Field(
        description="True if user wants restaurant recommendations"
    )
    cuisines: list[str] = Field(
        default_factory=list,
        description="Cuisine keywords like Japanese, Malaysian, Italian"
    )
    user_message_summary: str = Field(
        description="Short summary of what the user wants"
    )