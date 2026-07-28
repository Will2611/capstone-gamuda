from fastapi import APIRouter, Query, HTTPException
from datetime import date, datetime, timedelta, timezone
from sqlalchemy import func, desc
from src.database.connection import db_dependency
from src.database.models.visibility import (
    VisibilityMetricsModel,
    FunnelStageModel,
    SocialPlatformMetricsModel,
    SentimentDataModel,
    ComplaintThemeModel,
    SentimentThemeModel,
    FootTrafficHourlyModel,
)
from src.database.models.reviews import (
    ReviewModel
)
from src.database.models.user import (
    ClientModel,
)
from src.database.models.restaurants import (
    RestaurantModel
)
from src.database.schemas.visibility import (
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
    DemographicGroupEntry,
    DemographicsResponse,
    FootTrafficResponse,
    ActionSuggestion,
    ActionSuggestionsResponse,
)
from src.database.calculations import (
    compute_trend,
    compute_visibility_score,
    compute_social_engagement_rate,
    compute_repeat_visit_rate,
    compute_average_rating,
)
from src.database.traffic_analytics import (
    MAX_WEEK_OFFSET,
    build_chart_days,
    build_traffic_insights,
    select_week_dates,
    week_has_data,
)
import  uuid_utils.compat as uuid
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
    return [RestaurantListItemResponse(id=r.id, name=r.name, cuisines=','.join(r.cuisine)) for r in rows]


@router.get("/getSummaryMetrics", response_model=SummaryMetricsResponse)
async def get_summary_metrics(db: db_dependency, restaurantId: uuid.UUID = Query(...)):
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

    avg_rating = compute_average_rating(
        stored_avg=current.average_rating,
        total_reviews=current.total_reviews,
        sample_ratings=[5],
    )
    total_reviews_count = current.total_reviews

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
        avg_rating=avg_rating,
        total_reviews=total_reviews_count,
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
        compute_visibility_score(avg_rating, total_reviews_count, curr_social),
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
            value=avg_rating,
            totalReviews=total_reviews_count,
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
async def get_funnel_metrics(db: db_dependency, restaurantId: uuid.UUID = Query(...)):
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
async def get_social_visibility(db: db_dependency, restaurantId: uuid.UUID = Query(...)):
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
async def get_sentiment(db: db_dependency, restaurantId: uuid.UUID = Query(...)):
    row = (
        db.query(SentimentDataModel)
        .filter(SentimentDataModel.restaurant_id == restaurantId)
        .order_by(desc(SentimentDataModel.recorded_at))
        .first()
    )

    if row is None:
        raise HTTPException(status_code=404, detail="No sentiment data found")

    complaint_rows = (
        db.query(SentimentThemeModel)
        .filter(SentimentThemeModel.sentiment_type == "Negative")
        .filter(SentimentThemeModel.sentiment_id == row.id)
        .order_by(desc(SentimentThemeModel.count))
        .all()
    )
    positive_rows = (
        db.query(SentimentThemeModel)
        .filter(SentimentThemeModel.sentiment_type == "Positive")
        .filter(SentimentThemeModel.sentiment_id == row.id)
        .order_by(desc(SentimentThemeModel.count))
        .all()
    )
    return SentimentResponse(
        positivePct=round(row.positive_pct, 1),
        negativePct=round(row.negative_pct, 1),
        neutralPct=round(row.neutral_pct, 1),
        complaintThemes=[
            ComplaintThemeEntry(theme=c.theme, count=c.count)
            for c in complaint_rows
        ],
        positiveThemes=[
            ComplaintThemeEntry(theme=c.theme, count=c.count)
            for c in positive_rows
        ],
    )


def _age_bucket(age: int) -> str:
    if age < 25:
        return "18-24"
    if age < 35:
        return "25-34"
    if age < 45:
        return "35-44"
    if age < 55:
        return "45-54"
    return "55+"


@router.get("/getDemographics", response_model=DemographicsResponse)
async def get_demographics(db: db_dependency, restaurantId: uuid.UUID = Query(...)):
    rows = (
        db.query(ClientModel.gender, ClientModel.birth_date)
        .join(ReviewModel, ReviewModel.reviewer_id == ClientModel.id)
        .filter(
            ReviewModel.restaurant_id == restaurantId,
            ReviewModel.reviewer_id != None,
        )
        .group_by(ClientModel.id, ClientModel.gender, ClientModel.birth_date)
        .all()
    )

    age_groups = {
        "18-24": 0,
        "25-34": 0,
        "35-44": 0,
        "45-54": 0,
        "55+": 0,
    }
    gender_counts: dict[str, int] = {"Female": 0, "Male": 0, "Prefer not to say": 0}

    for gender, birth_date in rows:
        normalized_gender = (gender or "").strip().lower()
        if normalized_gender in {"female", "f"}:
            gender_label = "Female"
        elif normalized_gender in {"male", "m"}:
            gender_label = "Male"
        else:
            gender_label = "Prefer not to say"

        gender_counts[gender_label] += 1

        if birth_date:
            years = date.today().year - birth_date.year
            if (date.today().month, date.today().day) < (
                birth_date.month,
                birth_date.day,
            ):
                years -= 1
            age_groups[_age_bucket(years)] += 1

    return DemographicsResponse(
        restaurantId=restaurantId,
        totalVisitors=len(rows),
        ageGroups=[
            DemographicGroupEntry(label=label, count=count)
            for label, count in age_groups.items()
        ],
        genderBreakdown=[
            DemographicGroupEntry(label=label, count=count)
            for label, count in gender_counts.items()
        ],
    )


@router.get("/getReviewsByTheme", response_model=ReviewsByThemeResponse)
async def get_reviews_by_theme(
    db: db_dependency,
    restaurantId: uuid.UUID = Query(...),
    theme: str = Query("Wait Time"),
    sentimentType: str = Query(
        "Negative",
        description="Positive | Negative | Neutral — which theme bucket to open",
    ),
):
    sentiment = (
        db.query(SentimentDataModel)
        .filter(SentimentDataModel.restaurant_id == restaurantId)
        .order_by(desc(SentimentDataModel.recorded_at))
        .first()
    )
    if not sentiment:
        raise HTTPException(status_code=404, detail="No reviews found")

    allowed_types = {"Positive", "Negative", "Neutral"}
    resolved_type = sentimentType if sentimentType in allowed_types else "Negative"

    themed_reviews = (
        db.query(SentimentThemeModel)
        .filter(SentimentThemeModel.sentiment_id == sentiment.id)
        .filter(SentimentThemeModel.sentiment_type == resolved_type)
        .order_by(desc(SentimentThemeModel.created_at))
        .all()
    )
    if theme not in list(map(lambda x: x.theme,themed_reviews)):
        raise HTTPException(status_code=404, detail="No reviews found for this theme")

    all_flat_review_ids:list[uuid.UUID] = [
        listed_reviews
        for single in themed_reviews
        for listed_reviews in single.review_ids
        ]
    flat_review_ids:list[uuid.UUID] = [
        listed_reviews
        for single in themed_reviews
        if single.theme.strip().lower() == theme.strip().lower()
        for listed_reviews in single.review_ids
        ]
    
    review_id_set:set[uuid.UUID] = set()
    review_id_set.update(all_flat_review_ids)
    deduplicated = list(review_id_set)
    
    matched_reviews = (
        db.query(ReviewModel)
        .filter(ReviewModel.id.in_(flat_review_ids))
        .all()
    )
    total_negative = len(deduplicated)
    matched_count = len(flat_review_ids)

    items: list[ReviewItemResponse] = []
    for review in matched_reviews:
        items.append(ReviewItemResponse(
            stars=review.stars,
            text=review.content,
            matched=True,
        ))

    return ReviewsByThemeResponse(
        theme=theme,
        totalNegative=total_negative,
        matchedCount=matched_count,
        reviews=items,
    )


# ------ Foot Traffic ----

@router.get("/getFootTraffic", response_model=FootTrafficResponse)
async def get_foot_traffic(
    db: db_dependency,
    restaurantId: uuid.UUID = Query(...),
    weekOffset: int = Query(
        0,
        ge=0,
        le=MAX_WEEK_OFFSET,
        description="0 = this week (newest dates), 1 = last week",
    ),
):
    """Foot traffic from foot_traffic_hourly — 7 dates per weekOffset."""
    all_date_rows = (
        db.query(FootTrafficHourlyModel.traffic_date)
        .filter(FootTrafficHourlyModel.restaurant_id == restaurantId)
        .distinct()
        .order_by(FootTrafficHourlyModel.traffic_date.desc())
        .all()
    )
    all_dates_desc = [row[0] for row in all_date_rows]
    has_previous_week = week_has_data(all_dates_desc, 1)
    chart_dates = select_week_dates(all_dates_desc, weekOffset)

    empty = FootTrafficResponse(
        restaurantId=restaurantId,
        chartDays=[],
        weekdayTotal=0,
        weekendTotal=0,
        weekOffset=weekOffset,
        weekTotal=0,
        otherWeekTotal=None,
        hasPreviousWeek=has_previous_week,
        insights=build_traffic_insights([], []),
        updatedAt=datetime.now(timezone.utc).isoformat(),
    )

    if not chart_dates:
        return empty

    def _sum_visitors_for_dates(dates: list) -> int:
        if not dates:
            return 0
        total = (
            db.query(func.coalesce(func.sum(FootTrafficHourlyModel.visitors), 0))
            .filter(
                FootTrafficHourlyModel.restaurant_id == restaurantId,
                FootTrafficHourlyModel.traffic_date.in_(dates),
            )
            .scalar()
        )
        return int(total or 0)

    other_offset = 1 if weekOffset == 0 else 0
    other_dates = select_week_dates(all_dates_desc, other_offset)
    other_week_total = (
        _sum_visitors_for_dates(other_dates) if other_dates else None
    )

    hourly_rows = (
        db.query(
            FootTrafficHourlyModel.traffic_date,
            FootTrafficHourlyModel.day_name,
            FootTrafficHourlyModel.day_type,
            FootTrafficHourlyModel.hour,
            FootTrafficHourlyModel.visitors,
        )
        .filter(
            FootTrafficHourlyModel.restaurant_id == restaurantId,
            FootTrafficHourlyModel.traffic_date.in_(chart_dates),
        )
        .order_by(
            FootTrafficHourlyModel.traffic_date,
            FootTrafficHourlyModel.hour,
        )
        .all()
    )

    raw_rows = [
        (r.traffic_date, r.day_name, r.day_type, r.hour, r.visitors)
        for r in hourly_rows
    ]
    chart_days = build_chart_days(raw_rows)
    insights = build_traffic_insights(chart_days, raw_rows)

    weekday_total = sum(d.total for d in chart_days if d.dayType == "Weekday")
    weekend_total = sum(d.total for d in chart_days if d.dayType == "Weekend")
    week_total = weekday_total + weekend_total

    return FootTrafficResponse(
        restaurantId=restaurantId,
        chartDays=chart_days,
        weekdayTotal=weekday_total,
        weekendTotal=weekend_total,
        weekOffset=weekOffset,
        weekTotal=week_total,
        otherWeekTotal=other_week_total,
        hasPreviousWeek=has_previous_week,
        insights=insights,
        updatedAt=datetime.now(timezone.utc).isoformat(),
    )


# ---------------- Action Suggestions ----------------

@router.get("/getActionSuggestions", response_model=ActionSuggestionsResponse)
async def get_action_suggestions(db: db_dependency, restaurantId: uuid.UUID = Query(...)):
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
        db.query(SentimentThemeModel)
        .filter(SentimentThemeModel.sentiment_type == 'Negative')
        .join(SentimentDataModel)
        .filter(SentimentDataModel.restaurant_id == restaurantId)
        .order_by(desc(SentimentThemeModel.count))
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
