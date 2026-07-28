from typing import List, Optional
from pydantic import BaseModel, Field

class SinglePromotionSchema(BaseModel):
    title: str = Field(..., description="Catchy promotion title.")
    description: str = Field(..., description="Detailed campaign purpose, offer mechanics, and target audience.")
    event_tag: Optional[str] = Field(None, description="Tag like 'Holiday Deal', 'High ROI', or 'Sports Trend'.")
    suggested_start_date: str = Field(..., description="Start date formatted as YYYY-MM-DD.")
    suggested_end_date: str = Field(..., description="End date formatted as YYYY-MM-DD.")
    suggested_start_time: Optional[str] = Field(None, description="Start time formatted as HH:MM or empty if all day.")
    suggested_end_time: Optional[str] = Field(None, description="End time formatted as HH:MM or empty if all day.")
    is_all_day: bool = Field(True, description="True if available all day.")
    suggested_image_url: Optional[str] = Field(None, description="Unsplash photo URL relevant to the offer.")

class AIPromotionResponse(BaseModel):
    promotions: List[SinglePromotionSchema] = Field(
        ...,
        max_items=3,
        description="List containing at most 3 unique promotional ideas."
    ) # type: ignore

class AIPromotionRequest(BaseModel):
    user_input: Optional[str] = Field(None, description="User promo topic, dish, or null.")
    context_override: Optional[dict] = Field(None, description="Optional extra merchant context.")

class AIRewriteRequest(BaseModel):
    field: str = Field(..., description="Target field to generate: 'title' or 'description'")
    current_title: Optional[str] = Field(None, description="Current title in form (useful context when generating description)")
    current_text: Optional[str] = Field(None, description="Existing text in the input box for variation context")
    iteration_index: int = Field(1, description="Counter tracking how many times the user clicked rewrite")

class AIRewriteResponse(BaseModel):
    generated_text: str = Field(..., description="The rewritten title or description text")