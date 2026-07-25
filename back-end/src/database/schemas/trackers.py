"""Pydantic schemas for tracker event capture."""

from typing import Literal

from pydantic import BaseModel, Field
import uuid_utils.compat as uuid

TRACKED_TYPE = Literal["Impression", "Click", "Visit"]


class TrackerCreateRequest(BaseModel):
    restaurantId: uuid.UUID = Field(..., description="Restaurant being tracked")
    trackedType: TRACKED_TYPE = Field(
        ...,
        description="Impression | Click | Visit",
    )


class TrackerCreateResponse(BaseModel):
    id: uuid.UUID
    restaurantId: uuid.UUID
    trackedType: TRACKED_TYPE
    userId: uuid.UUID

    model_config = {"from_attributes": True}
