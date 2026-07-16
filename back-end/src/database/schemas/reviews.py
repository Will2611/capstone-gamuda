from pydantic import BaseModel, BeforeValidator
from typing import Literal, Annotated, Any
import uuid_utils.compat as uuid

SENTIMENT_TYPE= Literal["Positive","Negative", "Mixed", "Neutral"]
def clean_str(s:str):
    return ' '.join(s.lower().split('-'))
def str_list_cleaned(single_list:list[str]):
    return [clean_str(theme) for item in single_list if (theme:=item.strip())]

CleansedStrList = Annotated[list[str], BeforeValidator(str_list_cleaned)]

class SentimentModelValidation(BaseModel):
    positive:CleansedStrList
    neutral:CleansedStrList
    negative:CleansedStrList

def clean_key(d:dict[str,Any]):
    return {clean_str(k):item for k,item in d.items()}
CleansedKeyDict = Annotated[dict[str,list[uuid.UUID]], BeforeValidator(str_list_cleaned)]
class ThemesToReviewIds(BaseModel):
    positive:CleansedKeyDict
    negative:CleansedKeyDict
    neutral:CleansedKeyDict

    

class GoogleReviewsResponse(BaseModel):
    averageRating: float
    totalReviews: int
    reviewUrl: str


class InstagramPost(BaseModel):
    id: int
    thumbnailUrl: str
    postUrl: str


class InstagramResponse(BaseModel):
    posts: list[InstagramPost]
    profileUrl: str


class TikTokVideo(BaseModel):
    id: int
    thumbnailUrl: str
    videoUrl: str
    duration: str


class TikTokResponse(BaseModel):
    videos: list[TikTokVideo]
    profileUrl: str
