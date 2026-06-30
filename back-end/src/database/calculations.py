"""
KPI Calculation Engine -- all dashboard metric formulas live here.

Visibility Score, Social Engagement Rate, Repeat Visit Rate, and trend
calculations are kept separate from the API layer.
"""
from typing import Optional


# === Weights ===

VISIBILITY_WEIGHTS = {
    "review_rate": 0.50,
    "social_rate": 0.50,
}


# === Trend ===

def compute_trend(current: float, previous: float) -> str:
    if previous == 0:
        return "flat"
    pct_change = ((current - previous) / abs(previous)) * 100
    if pct_change > 2:
        return "up"
    if pct_change < -2:
        return "down"
    return "flat"


# === Social Engagement Rate (%) ===

def compute_social_engagement_rate(
    total_reviews: int,
    funnel_impressions: int,
) -> float:
    """
    Engagement rate derived purely from Google review activity.

        rate = (total_reviews / impressions) × 100

    Represents the % of people who saw the restaurant and
    were engaged enough to leave a Google review.
    """
    imp = max(1, funnel_impressions)
    review_rate = (total_reviews / imp) * 100.0
    return round(review_rate, 1)


# === Repeat Visit Rate (%) ===

def compute_repeat_visit_rate(
    positive_pct: float,
    avg_rating: float,
    total_reviews: int,
) -> float:
    """
    Estimated repeat-visit likelihood from sentiment + rating signals.

    Drivers:
    • Sentiment  (70 %) : positive_pct reflects satisfaction → return intent.
    • Rating     (20 %) : 5-star ratio indicates delight → loyalty.
    • Volume     (10 %) : high review volume signals habitual visits.

    Capped at 95 %.
    """
    sentiment_factor = positive_pct * 0.70
    rating_factor = (avg_rating / 5.0) * 100.0 * 0.20
    volume_factor = min(100.0, (total_reviews / 2000.0) * 100.0) * 0.10

    raw = sentiment_factor + rating_factor + volume_factor
    return round(min(95.0, raw), 1)


# === Visibility Score (0--100) ===

def compute_visibility_score(
    avg_rating: float,
    total_reviews: int,
    social_rate: float,
) -> float:
    """
    Composite score from two weighted sub-scores:

    • review_sub  = (avg_rating / 5.0) × 100             → 4.6/5 = 92
    • social_sub  = min(100, social_rate × 25)           → 3.0% → 75

    Weights: review 50 %, social 50 %.
    """
    w = VISIBILITY_WEIGHTS
    review_sub = (avg_rating / 5.0) * 100.0
    social_sub = min(100.0, social_rate * 25.0)

    return (
        w["review_rate"] * review_sub
        + w["social_rate"] * social_sub
    )
