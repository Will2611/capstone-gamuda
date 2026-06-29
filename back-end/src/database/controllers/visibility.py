from fastapi import APIRouter, Query, HTTPException
from datetime import date, timedelta
from sqlalchemy import func, desc
from src.database.connection import db_dependency
from src.database.schemas.visibility import (
    RestaurantModel,
    VisibilityMetricsModel,
    FunnelStageModel,
    SocialPlatformMetricsModel,
    SentimentDataModel,
    ComplaintThemeModel,
    SummaryMetricsResponse,
    VisibilityScoreEntry,
    AverageRatingEntry,
    SocialEngagementEntry,
    RepeatVisitEntry,
    FunnelMetricsResponse,
    FunnelStageEntry,
    SocialVisibilityResponse,
    SocialPlatformCardResponse,
    PlatformMetricEntry,
    SentimentResponse,
    ComplaintThemeEntry,
    RestaurantListItemResponse,
    ReviewsByThemeResponse,
    ReviewItemResponse,
)
from src.database.calculations import (
    compute_trend,
    compute_visibility_score,
    compute_brand_awareness,
    compute_local_search_rank,
    compute_keyword_match_rate,
    compute_content_freshness,
)
import re

router = APIRouter(prefix="/visibility", tags=["visibility"])


def _to_platform_label(platform: str) -> str:
    mapping = {
        "google": "Google Reviews",
        "instagram": "Instagram",
        "tiktok": "TikTok",
    }
    return mapping.get(platform, platform.title())


def _build_platform_metrics(platform_row, colour_class: str) -> list[PlatformMetricEntry]:
    metrics: list[PlatformMetricEntry] = []
    if platform_row.platform == "google":
        if platform_row.avg_rating is not None:
            metrics.append(PlatformMetricEntry(label="Average Rating", value=f"{platform_row.avg_rating:.1f} / 5.0"))
        if platform_row.total_reviews is not None:
            metrics.append(PlatformMetricEntry(label="Total Reviews", value=str(platform_row.total_reviews)))
        metrics.append(PlatformMetricEntry(label="Recent Reviews", value=f"{platform_row.posts_this_month} / week"))
    elif platform_row.platform == "instagram":
        metrics.append(PlatformMetricEntry(label="Mentions", value=str(platform_row.posts_this_month)))
        metrics.append(PlatformMetricEntry(label="Engagement Rate", value=f"{platform_row.engagement_rate or 0:.1f}%"))
    elif platform_row.platform == "tiktok":
        metrics.append(PlatformMetricEntry(label="Video Mentions", value=str(platform_row.posts_this_month)))
        metrics.append(PlatformMetricEntry(label="Engagement Rate", value=f"{platform_row.engagement_rate or 0:.1f}%"))
    return metrics


# ────────────────────── Endpoints ──────────────────────

@router.get("/restaurants", response_model=list[RestaurantListItemResponse])
async def list_restaurants(db: db_dependency):
    rows = db.query(RestaurantModel).order_by(RestaurantModel.name).all()
    return [RestaurantListItemResponse(id=r.id, name=r.name, cuisines=r.cuisines) for r in rows]


@router.get("/getSummaryMetrics", response_model=SummaryMetricsResponse)
async def get_summary_metrics(db: db_dependency, restaurantId: int = Query(...)):
    today = date.today()
    prev_month = today - timedelta(days=30)

    current = (
        db.query(VisibilityMetricsModel)
        .filter(
            VisibilityMetricsModel.restaurant_id == restaurantId,
            VisibilityMetricsModel.recorded_at <= today,
        )
        .order_by(desc(VisibilityMetricsModel.recorded_at))
        .first()
    )

    previous = (
        db.query(VisibilityMetricsModel)
        .filter(
            VisibilityMetricsModel.restaurant_id == restaurantId,
            VisibilityMetricsModel.recorded_at <= prev_month,
        )
        .order_by(desc(VisibilityMetricsModel.recorded_at))
        .first()
    )

    sentiment = (
        db.query(SentimentDataModel)
        .filter(SentimentDataModel.restaurant_id == restaurantId)
        .order_by(desc(SentimentDataModel.recorded_at))
        .first()
    )

    if current is None:
        raise HTTPException(status_code=404, detail="No metrics found for this restaurant")

    # ── Calculate visibility score from underlying sub-metrics ──
    s_rank = sentiment.local_search_rank if sentiment else 10
    s_posts = sentiment.posts_per_week_avg if sentiment else 0.0

    curr_score = round(
        compute_visibility_score(
            s_rank, current.average_rating, current.social_engagement_rate, s_posts
        ),
        1,
    )

    prev_score = curr_score
    if previous and sentiment:
        prev_score = round(
            compute_visibility_score(
                s_rank, previous.average_rating, previous.social_engagement_rate, s_posts
            ),
            1,
        )

    curr_social = round(current.social_engagement_rate, 1)
    prev_social = round(previous.social_engagement_rate, 1) if previous else curr_social

    curr_repeat = round(current.repeat_visit_rate, 1)
    prev_repeat = round(previous.repeat_visit_rate, 1) if previous else curr_repeat

    response = SummaryMetricsResponse(
        visibilityScore=VisibilityScoreEntry(
            value=curr_score,
            changeVsLastMonth=round(curr_score - prev_score, 1),
            trend=compute_trend(curr_score, prev_score),
        ),
        averageRating=AverageRatingEntry(
            value=round(current.average_rating, 1),
            totalReviews=current.total_reviews,
            source=current.rating_source,
        ),
        socialEngagementRate=SocialEngagementEntry(
            value=curr_social,
            changeVsLastMonth=round(curr_social - prev_social, 1),
            trend=compute_trend(curr_social, prev_social),
        ),
        repeatVisitRate=RepeatVisitEntry(
            value=curr_repeat,
            changeVsLastMonth=round(curr_repeat - prev_repeat, 1),
            trend=compute_trend(curr_repeat, prev_repeat),
        ),
    )
    return response


@router.get("/getFunnelMetrics", response_model=FunnelMetricsResponse)
async def get_funnel_metrics(db: db_dependency, restaurantId: int = Query(...)):
    rows = (
        db.query(FunnelStageModel)
        .filter(FunnelStageModel.restaurant_id == restaurantId)
        .order_by(desc(FunnelStageModel.recorded_at))
        .all()
    )

    if not rows:
        raise HTTPException(status_code=404, detail="No funnel data found")

    latest_date = rows[0].recorded_at
    latest_stages = [r for r in rows if r.recorded_at == latest_date]
    # Keep original order: impressions → clicks → direction → visits → reviews
    stage_order = {"Impressions": 0, "Clicks": 1, "Click-to-Direction": 2, "Visits": 3, "Reviews": 4}
    latest_stages.sort(key=lambda s: stage_order.get(s.stage_name, 99))

    stages = [
        FunnelStageEntry(
            name=s.stage_name,
            count=s.count,
            conversion=s.conversion,
            isDropOff=s.is_drop_off,
        )
        for s in latest_stages
    ]
    return FunnelMetricsResponse(stages=stages)


@router.get("/getSocialVisibility", response_model=SocialVisibilityResponse)
async def get_social_visibility(db: db_dependency, restaurantId: int = Query(...)):
    rows = (
        db.query(SocialPlatformMetricsModel)
        .filter(SocialPlatformMetricsModel.restaurant_id == restaurantId)
        .order_by(desc(SocialPlatformMetricsModel.recorded_at))
        .all()
    )

    if not rows:
        raise HTTPException(status_code=404, detail="No social data found")

    latest_date = rows[0].recorded_at
    latest = [r for r in rows if r.recorded_at == latest_date]

    colour_map = {
        "google": "text-bs-gold",
        "instagram": "text-bs-red",
        "tiktok": "text-bs-blue",
    }

    platforms: list[SocialPlatformCardResponse] = []
    for p in latest:
        platforms.append(
            SocialPlatformCardResponse(
                platform=_to_platform_label(p.platform),
                metrics=_build_platform_metrics(p, colour_map.get(p.platform, "")),
                url=p.url or "#",
            )
        )

    return SocialVisibilityResponse(platforms=platforms)


@router.get("/getSentiment", response_model=SentimentResponse)
async def get_sentiment(db: db_dependency, restaurantId: int = Query(...)):
    row = (
        db.query(SentimentDataModel)
        .filter(SentimentDataModel.restaurant_id == restaurantId)
        .order_by(desc(SentimentDataModel.recorded_at))
        .first()
    )

    if row is None:
        raise HTTPException(status_code=404, detail="No sentiment data found")

    complaint_rows = (
        db.query(ComplaintThemeModel)
        .filter(ComplaintThemeModel.sentiment_id == row.id)
        .all()
    )

    # ── Brand Awareness Calculation ──
    # See src/database/calculations.py for formula details
    metrics = (
        db.query(VisibilityMetricsModel)
        .filter(
            VisibilityMetricsModel.restaurant_id == restaurantId,
            VisibilityMetricsModel.recorded_at <= row.recorded_at,
        )
        .order_by(desc(VisibilityMetricsModel.recorded_at))
        .first()
    )

    if metrics is None:
        raise HTTPException(status_code=404, detail="No metrics found")

    # ── SEO: Local Search Rank ──
    # Derived from impressions, review volume, rating, social engagement, and freshness
    funnel_impressions = (
        db.query(FunnelStageModel)
        .filter(
            FunnelStageModel.restaurant_id == restaurantId,
            FunnelStageModel.stage_name == "Impressions",
            FunnelStageModel.recorded_at <= row.recorded_at,
        )
        .order_by(desc(FunnelStageModel.recorded_at))
        .first()
    )
    impressions = funnel_impressions.count if funnel_impressions else 0

    # ── SEO: Content Freshness (posts/week from Instagram + TikTok) ──
    social_rows = (
        db.query(SocialPlatformMetricsModel)
        .filter(
            SocialPlatformMetricsModel.restaurant_id == restaurantId,
            SocialPlatformMetricsModel.recorded_at <= row.recorded_at,
        )
        .order_by(desc(SocialPlatformMetricsModel.recorded_at))
        .all()
    )

    ig_posts = 0
    tiktok_posts = 0
    for s in social_rows:
        if s.recorded_at == social_rows[0].recorded_at if social_rows else None:
            if s.platform == "instagram":
                ig_posts = s.posts_this_month
            elif s.platform == "tiktok":
                tiktok_posts = s.posts_this_month

    posts_per_week = compute_content_freshness(ig_posts, tiktok_posts)

    local_rank = compute_local_search_rank(
        impressions=impressions,
        total_reviews=metrics.total_reviews,
        avg_rating=metrics.average_rating,
        social_engagement_rate=metrics.social_engagement_rate,
        posts_per_week=posts_per_week,
    )

    # ── SEO: Keyword Match Rate ──
    restaurant = db.query(RestaurantModel).filter(RestaurantModel.id == restaurantId).first()
    kw_match = compute_keyword_match_rate(
        cuisines=restaurant.cuisines if restaurant else "general",
        sample_reviews=restaurant.sample_reviews if restaurant else None,
    )

    # ── Search rank change vs previous month ──
    prev_date = row.recorded_at - timedelta(days=30)
    prev_funnel = (
        db.query(FunnelStageModel)
        .filter(
            FunnelStageModel.restaurant_id == restaurantId,
            FunnelStageModel.stage_name == "Impressions",
            FunnelStageModel.recorded_at <= prev_date,
        )
        .order_by(desc(FunnelStageModel.recorded_at))
        .first()
    )
    prev_impressions = prev_funnel.count if prev_funnel else impressions

    prev_social_rows = (
        db.query(SocialPlatformMetricsModel)
        .filter(
            SocialPlatformMetricsModel.restaurant_id == restaurantId,
            SocialPlatformMetricsModel.recorded_at <= prev_date,
        )
        .order_by(desc(SocialPlatformMetricsModel.recorded_at))
        .all()
    )
    prev_ig = 0
    prev_tt = 0
    if prev_social_rows:
        prev_date_val = prev_social_rows[0].recorded_at
        for s in prev_social_rows:
            if s.recorded_at == prev_date_val:
                if s.platform == "instagram":
                    prev_ig = s.posts_this_month
                elif s.platform == "tiktok":
                    prev_tt = s.posts_this_month

    prev_posts = compute_content_freshness(prev_ig, prev_tt)

    prev_metrics = (
        db.query(VisibilityMetricsModel)
        .filter(
            VisibilityMetricsModel.restaurant_id == restaurantId,
            VisibilityMetricsModel.recorded_at <= prev_date,
        )
        .order_by(desc(VisibilityMetricsModel.recorded_at))
        .first()
    )

    if prev_metrics:
        prev_rank = compute_local_search_rank(
            impressions=prev_impressions,
            total_reviews=prev_metrics.total_reviews,
            avg_rating=prev_metrics.average_rating,
            social_engagement_rate=prev_metrics.social_engagement_rate,
            posts_per_week=prev_posts,
        )
        rank_change = prev_rank - local_rank  # positive = improved (rank dropped)
    else:
        rank_change = 0

    # ── Brand Awareness ──
    awareness = round(
        compute_brand_awareness(
            search_rank=local_rank,
            total_reviews=metrics.total_reviews,
            social_engagement_rate=metrics.social_engagement_rate,
            posts_per_week_avg=posts_per_week,
        ),
        1,
    )

    # Previous month awareness
    prev_sentiment = (
        db.query(SentimentDataModel)
        .filter(
            SentimentDataModel.restaurant_id == restaurantId,
            SentimentDataModel.recorded_at <= prev_date,
        )
        .order_by(desc(SentimentDataModel.recorded_at))
        .first()
    )

    if prev_sentiment and prev_metrics:
        prev_awareness = round(
            compute_brand_awareness(
                search_rank=prev_rank,
                total_reviews=prev_metrics.total_reviews,
                social_engagement_rate=prev_metrics.social_engagement_rate,
                posts_per_week_avg=prev_posts,
            ),
            1,
        )
        awareness_change = round(awareness - prev_awareness, 1)
    else:
        awareness_change = 0.0

    return SentimentResponse(
        positivePct=round(row.positive_pct, 1),
        negativePct=round(row.negative_pct, 1),
        brandAwarenessPct=awareness,
        brandAwarenessChange=awareness_change,
        localSearchRank=local_rank,
        searchRankChange=rank_change,
        keywordMatchRate=kw_match,
        postsPerWeekAvg=posts_per_week,
        complaintThemes=[
            ComplaintThemeEntry(theme=c.theme, count=c.count)
            for c in complaint_rows
        ],
    )


# ──────────────── Theme → Review Keyword Map ────────────────

THEME_KEYWORDS: dict[str, list[str]] = {
    "Wait Time": ["wait", "waited", "longer", "slow", "rushed", "delay", "crowded"],
    "Taste": ["taste", "flavor", "average", "inconsistent", "bland", "spoil", "didn't match", "tasteless"],
    "Service": ["slow service", "inattentive", "rude", "unfriendly", "ignored", "mistake", "wrong order"],
}


def _parse_reviews(raw: str, ratings: list[int] | None = None) -> list[dict]:
    """Split sample_reviews text into individual review dicts with stars and text."""
    results = []
    parts = re.split(r"\s*\|\s*", raw)
    for i, part in enumerate(parts):
        part = part.strip()
        if not part:
            continue
        # Strip leading number and quotes
        text = re.sub(r"^\d+\.\s*", "", part).strip()
        text = text.strip('"').strip("'")
        stars = ratings[i] if ratings and i < len(ratings) else 3
        results.append({"stars": stars, "text": text})
    return results


def _keyword_match(text: str, keywords: list[str]) -> bool:
    lower = text.lower()
    return any(kw.lower() in lower for kw in keywords)


@router.get("/getReviewsByTheme", response_model=ReviewsByThemeResponse)
async def get_reviews_by_theme(
    db: db_dependency,
    restaurantId: int = Query(...),
    theme: str = Query("Wait Time"),
):
    restaurant = db.query(RestaurantModel).filter(RestaurantModel.id == restaurantId).first()
    if not restaurant or not restaurant.sample_reviews:
        raise HTTPException(status_code=404, detail="No reviews found")

    reviews = _parse_reviews(restaurant.sample_reviews, restaurant.review_ratings)
    keywords = THEME_KEYWORDS.get(theme, THEME_KEYWORDS.get("Wait Time", []))

    # Only negative (≤3 stars) reviews belong in a complaint-themed view
    negative_reviews = [r for r in reviews if r["stars"] <= 3]
    matched_count = 0
    total_negative = len(negative_reviews)

    items: list[ReviewItemResponse] = []
    for r in negative_reviews:
        matched = _keyword_match(r["text"], keywords)
        if matched:
            matched_count += 1
        items.append(ReviewItemResponse(stars=r["stars"], text=r["text"], matched=matched))

    return ReviewsByThemeResponse(
        theme=theme,
        totalNegative=total_negative,
        matchedCount=matched_count,
        reviews=items,
    )
