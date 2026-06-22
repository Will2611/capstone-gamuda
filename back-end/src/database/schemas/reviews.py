from pydantic import BaseModel


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
