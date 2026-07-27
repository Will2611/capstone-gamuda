from datetime import date, time
from typing import Optional, Union
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, AliasChoices, field_validator

class PromotionBase(BaseModel):
    promoId: Optional[str] = Field(None, validation_alias=AliasChoices("promoId", "promo_id"), serialization_alias="promoId")
    restaurantId: Optional[UUID] = Field(None, validation_alias=AliasChoices("restaurantId", "restaurant_id"), serialization_alias="restaurantId")
    title: str
    description: str
    imageUrl: str = Field(..., validation_alias=AliasChoices("imageUrl", "image_url"), serialization_alias="imageUrl")
    websiteUrl: Optional[str] = Field("", validation_alias=AliasChoices("websiteUrl", "website_url"), serialization_alias="websiteUrl")
    startDate: date = Field(..., validation_alias=AliasChoices("startDate", "start_date"), serialization_alias="startDate")
    endDate: date = Field(..., validation_alias=AliasChoices("endDate", "end_date"), serialization_alias="endDate")
    startTime: Optional[Union[time, str]] = Field(None, validation_alias=AliasChoices("startTime", "start_time"), serialization_alias="startTime")
    endTime: Optional[Union[time, str]] = Field(None, validation_alias=AliasChoices("endTime", "end_time"), serialization_alias="endTime")
    isAllDay: bool = Field(True, validation_alias=AliasChoices("isAllDay", "is_all_day"), serialization_alias="isAllDay")
    status: str = "ACTIVE"

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    @field_validator("startTime", "endTime", mode="before")
    @classmethod
    def parse_empty_time(cls, v):
        if v == "" or v is None:
            return None
        return v

class PromotionCreate(PromotionBase):
    id: Optional[UUID] = None

class PromotionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    imageUrl: Optional[str] = Field(None, validation_alias=AliasChoices("imageUrl", "image_url"), serialization_alias="imageUrl")
    websiteUrl: Optional[str] = Field(None, validation_alias=AliasChoices("websiteUrl", "website_url"), serialization_alias="websiteUrl")
    startDate: Optional[date] = Field(None, validation_alias=AliasChoices("startDate", "start_date"), serialization_alias="startDate")
    endDate: Optional[date] = Field(None, validation_alias=AliasChoices("endDate", "end_date"), serialization_alias="endDate")
    startTime: Optional[Union[time, str]] = Field(None, validation_alias=AliasChoices("startTime", "start_time"), serialization_alias="startTime")
    endTime: Optional[Union[time, str]] = Field(None, validation_alias=AliasChoices("endTime", "end_time"), serialization_alias="endTime")
    isAllDay: Optional[bool] = Field(None, validation_alias=AliasChoices("isAllDay", "is_all_day"), serialization_alias="isAllDay")
    status: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    @field_validator("startTime", "endTime", mode="before")
    @classmethod
    def parse_empty_time(cls, v):
        if v == "" or v is None:
            return None
        return v

class PromotionResponse(PromotionBase):
    id: UUID
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)