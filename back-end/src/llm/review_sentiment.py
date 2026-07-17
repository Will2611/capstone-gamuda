from typing import Literal

from pydantic import BaseModel, Field

SentimentLabel = Literal["Positive", "Negative", "Neutral"]
ThemeLabel = Literal["Wait Time", "Taste", "Service", "Other"]


class ReviewSentimentResult(BaseModel):
    sentiment: SentimentLabel = Field(
        description="True sentiment based primarily on review text",
    )
    theme: ThemeLabel = Field(
        description="Main topic: Wait Time, Taste, Service, or Other",
    )
