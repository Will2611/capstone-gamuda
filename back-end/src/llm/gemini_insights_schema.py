"""Structured Gemini output for Troubleshoot Center — kept short to save tokens."""

from typing import Literal

from pydantic import BaseModel, Field


class GeminiInsightItem(BaseModel):
    issue: str = Field(description="Short issue title, max ~10 words")
    impact: Literal["High", "Medium", "Low"]
    recommendation: str = Field(description="One actionable sentence fix")


class GeminiInsightsResult(BaseModel):
    suggestions: list[GeminiInsightItem] = Field(
        description="At most 2 actionable items from the reviews",
        max_length=2,
    )
