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
    FootTrafficHourlyModel,
    FootTrafficDailyModel,
    HourlyTrafficItem,
    DailyTrafficSummary,
    FootTrafficResponse,
    ActionSuggestion,
    ActionSuggestionsResponse,
)
from src.database.calculations import (
    compute_trend,
    compute_visibility_score,
    compute_social_engagement_rate,
    compute_repeat_visit_rate,
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


# ------ Endpoints ----

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

    # -- Funnel impressions (for social engagement rate denominator) ----
    funnel_imp_row = (
        db.query(FunnelStageModel)
        .filter(
            FunnelStageModel.restaurant_id == restaurantId,
            FunnelStageModel.stage_name == "Impressions",
            FunnelStageModel.recorded_at <= today,
        )
        .order_by(desc(FunnelStageModel.recorded_at))
        .first()
    )
    curr_impressions = funnel_imp_row.count if funnel_imp_row else 0

    prev_imp_row = (
        db.query(FunnelStageModel)
        .filter(
            FunnelStageModel.restaurant_id == restaurantId,
            FunnelStageModel.stage_name == "Impressions",
            FunnelStageModel.recorded_at <= prev_month,
        )
        .order_by(desc(FunnelStageModel.recorded_at))
        .first()
    )
    prev_impressions = prev_imp_row.count if prev_imp_row else curr_impressions

    # -- Social Engagement Rate = f(total_reviews, impressions) ----
    curr_social = compute_social_engagement_rate(
        total_reviews=current.total_reviews,
        funnel_impressions=curr_impressions,
    )
    prev_total = previous.total_reviews if previous else current.total_reviews
    prev_social = compute_social_engagement_rate(
        total_reviews=prev_total,
        funnel_impressions=prev_impressions,
    )

    # -- Repeat Visit Rate = f(positive_pct, avg_rating, total_reviews) ----
    pos_pct = sentiment.positive_pct if sentiment else 80.0
    curr_repeat = compute_repeat_visit_rate(
        positive_pct=pos_pct,
        avg_rating=current.average_rating,
        total_reviews=current.total_reviews,
    )
    prev_repeat = curr_repeat
    if previous and sentiment:
        prev_repeat = compute_repeat_visit_rate(
            positive_pct=pos_pct,
            avg_rating=previous.average_rating,
            total_reviews=previous.total_reviews,
        )

    # -- Visibility Score = f(avg_rating, total_reviews, social_rate) ----
    curr_score = round(
        compute_visibility_score(
            current.average_rating, current.total_reviews, curr_social
        ),
        1,
    )
    prev_score = curr_score
    if previous:
        prev_score = round(
            compute_visibility_score(
                previous.average_rating, previous.total_reviews, prev_social
            ),
            1,
        )

    return SummaryMetricsResponse(
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

    return SentimentResponse(
        positivePct=round(row.positive_pct, 1),
        negativePct=round(row.negative_pct, 1),
        complaintThemes=[
            ComplaintThemeEntry(theme=c.theme, count=c.count)
            for c in complaint_rows
        ],
    )


# ------ Theme → Review Keyword Map ----

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


# ------ Foot Traffic ----

@router.get("/getFootTraffic", response_model=FootTrafficResponse)
async def get_foot_traffic(db: db_dependency, restaurantId: int = Query(...)):
    # -- Hourly: average visitors per hour, grouped by weekday / weekend ----
    hourly_rows = (
        db.query(
            FootTrafficHourlyModel.hour,
            FootTrafficHourlyModel.day_type,
            func.avg(FootTrafficHourlyModel.visitors).label("avg_visitors"),
        )
        .filter(FootTrafficHourlyModel.restaurant_id == restaurantId)
        .group_by(FootTrafficHourlyModel.hour, FootTrafficHourlyModel.day_type)
        .order_by(FootTrafficHourlyModel.hour)
        .all()
    )

    hourly_map: dict[int, dict[str, float]] = {}
    for hr, dt, avg in hourly_rows:
        hourly_map.setdefault(hr, {})[dt] = round(float(avg), 1)

    hourly = []
    for hr in sorted(hourly_map.keys()):
        wd = hourly_map[hr].get("Weekday", 0)
        we = hourly_map[hr].get("Weekend", 0)
        hourly.append(HourlyTrafficItem(hour=hr, weekdayAvg=wd, weekendAvg=we))

    # -- Daily: weekday vs weekend totals & averages ----
    daily_rows = (
        db.query(
            FootTrafficDailyModel.day_type,
            func.sum(FootTrafficDailyModel.visits).label("total"),
            func.avg(FootTrafficDailyModel.visits).label("avg_visits"),
            func.count(FootTrafficDailyModel.id).label("days"),
        )
        .filter(FootTrafficDailyModel.restaurant_id == restaurantId)
        .group_by(FootTrafficDailyModel.day_type)
        .all()
    )

    weekday_total = 0
    weekend_total = 0
    weekday_avg = 0.0
    weekend_avg = 0.0

    for dt, total, avg_v, days in daily_rows:
        if dt == "Weekday":
            weekday_total = int(total)
            weekday_avg = round(float(avg_v), 1)
        elif dt == "Weekend":
            weekend_total = int(total)
            weekend_avg = round(float(avg_v), 1)

    daily = DailyTrafficSummary(
        weekdayAvg=weekday_avg,
        weekendAvg=weekend_avg,
        weekdayTotal=weekday_total,
        weekendTotal=weekend_total,
    )

    return FootTrafficResponse(
        restaurantId=restaurantId,
        hourly=hourly,
        daily=daily,
    )


# ---------------- Action Suggestions ----------------

@router.get("/getActionSuggestions", response_model=ActionSuggestionsResponse)
async def get_action_suggestions(db: db_dependency, restaurantId: int = Query(...)):
    """
    Rule-based suggestion engine that analyses the restaurant's live metrics
    and returns the top 3 actionable recommendations for the owner.
    """
    today = date.today()

    metrics = (
        db.query(VisibilityMetricsModel)
        .filter(VisibilityMetricsModel.restaurant_id == restaurantId)
        .order_by(desc(VisibilityMetricsModel.recorded_at))
        .first()
    )
    sentiment = (
        db.query(SentimentDataModel)
        .filter(SentimentDataModel.restaurant_id == restaurantId)
        .order_by(desc(SentimentDataModel.recorded_at))
        .first()
    )
    complaint_rows = (
        db.query(ComplaintThemeModel)
        .join(SentimentDataModel)
        .filter(SentimentDataModel.restaurant_id == restaurantId)
        .order_by(desc(ComplaintThemeModel.count))
        .all()
    )

    if not metrics:
        raise HTTPException(status_code=404, detail="No data found")

    suggestions: list[ActionSuggestion] = []

    avg_rating = metrics.average_rating
    total_reviews = metrics.total_reviews
    social_eng = metrics.social_engagement_rate
    repeat_rate = metrics.repeat_visit_rate
    neg_pct = sentiment.negative_pct if sentiment else 20.0
    top_complaint = complaint_rows[0].theme if complaint_rows else "Service"

    # 1. Review & rating health
    if avg_rating < 4.2:
        suggestions.append(ActionSuggestion(
            issue="Low average rating",
            impact="High",
            recommendation=f"Your rating is {avg_rating}/5. Respond to negative reviews within 24 hours. "
                          f"Encourage satisfied customers to leave Google reviews with a QR code at checkout. "
                          f"Target: reach 4.5+ in 30 days."
        ))
    elif neg_pct > 20:
        suggestions.append(ActionSuggestion(
            issue="Negative review trend",
            impact="High",
            recommendation=f"{neg_pct}% of reviews are negative. The top complaint is \"{top_complaint}\". "
                          f"Address this directly in a public response and implement a service recovery "
                          f"program (e.g., complimentary item for affected customers)."
        ))
    elif total_reviews < 800:
        suggestions.append(ActionSuggestion(
            issue="Low review volume",
            impact="Medium",
            recommendation=f"Only {total_reviews} reviews collected. Launch a review-generation campaign: "
                          f"offer a small discount or loyalty points to customers who leave a Google review. "
                          f"Target: 100+ new reviews this month."
        ))
    else:
        suggestions.append(ActionSuggestion(
            issue="Maintain review momentum",
            impact="Low",
            recommendation=f"Rating is strong at {avg_rating}/5 with {total_reviews} reviews. "
                          f"Keep engaging with reviewers weekly to sustain your reputation. "
                          f"Highlight positive reviews on social media."
        ))

    # 2. Social engagement
    if social_eng < 3.0:
        suggestions.append(ActionSuggestion(
            issue="Low social engagement",
            impact="High",
            recommendation=f"Engagement rate is only {social_eng}%. Post 3x per week on Google Posts "
                          f"with photos of daily specials. Run a poll or Q&A story to boost interaction. "
                          f"Target: 4%+ engagement within 60 days."
        ))
    elif social_eng < 5.0:
        suggestions.append(ActionSuggestion(
            issue="Moderate social engagement",
            impact="Medium",
            recommendation=f"Engagement is {social_eng}% -- room to grow. Share behind-the-scenes content "
                          f"and user-generated photos. Collaborate with a local food influencer for a "
                          f"feature post to reach new audiences."
        ))
    else:
        suggestions.append(ActionSuggestion(
            issue="Social presence is strong",
            impact="Low",
            recommendation=f"Engagement is healthy at {social_eng}%. Leverage this momentum: "
                          f"launch a limited-time offer exclusive to your followers to drive "
                          f"repeat visits and word-of-mouth referrals."
        ))

    # 3. Repeat visit rate
    if repeat_rate < 65:
        suggestions.append(ActionSuggestion(
            issue="Low repeat visit rate",
            impact="High",
            recommendation=f"Only {repeat_rate}% of customers return. Implement a digital loyalty card "
                          f"(e.g., 5th visit free). Send a personalised follow-up email 7 days after "
                          f"each visit with a special offer. Target: 70%+ within 90 days."
        ))
    elif repeat_rate < 75:
        suggestions.append(ActionSuggestion(
            issue="Moderate repeat rate",
            impact="Medium",
            recommendation=f"Repeat rate is {repeat_rate}%. Introduce a seasonal menu rotation to give "
                          f"regulars a reason to return. Offer an exclusive preview tasting event for "
                          f"loyal customers to build community."
        ))
    else:
        suggestions.append(ActionSuggestion(
            issue="Strong customer loyalty",
            impact="Low",
            recommendation=f"Repeat rate is excellent at {repeat_rate}%. Reward your regulars with a VIP "
                          f"program. Use their feedback to refine the menu -- they are your best source "
                          f"of honest, actionable input."
        ))

    return ActionSuggestionsResponse(
        restaurantId=restaurantId,
        suggestions=suggestions[:3],
    )
