from pydantic import BaseModel, Field

class DiningIntent(BaseModel):
    needs_restaurant_search: bool = Field(
        description="True if user wants restaurant recommendations"
    )
    wants_more_alternatives: bool = Field(
        default=False,
        description=(
            "True if user wants different/more options than already shown "
            "(e.g. 'other suggestions', 'show me more', 'anything else?')"
        ),
    )
    cuisines: list[str] = Field(
        default_factory=list,
        description="Cuisine keywords like Japanese, Malaysian, Italian"
    )
    user_message_summary: str = Field(
        description="Short summary of what the user wants"
    )
    max_distance_km: float | None = Field(
        default=None,
        description="Max distance in km if user specifies (e.g. 'within 2km' -> 2.0, 'near me' -> 3.0). None means use default 10km."
    )
    price_level: int | None = Field(
        default=None,
        description="1=cheap/budget, 2=moderate, 3=expensive, 4=very expensive/fine dining. None if not specified."
    )
    dietary: list[str] = Field(
        default_factory=list,
        description="Dietary restrictions mentioned by user: Halal, Vegetarian, Vegan, Gluten-free. Empty list if none stated."
    )
