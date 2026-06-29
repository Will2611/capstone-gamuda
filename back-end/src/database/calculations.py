"""
KPI Calculation Engine — all dashboard metric formulas live here.

Visibility Score, Brand Awareness, SEO metrics, and trend calculations
are kept separate from the API layer so they can be tested and reused independently.
"""

import re
from typing import Optional


# ──────────── Weights ────────────

VISIBILITY_WEIGHTS = {
    "search_rank": 0.30,
    "reviews": 0.30,
    "social": 0.20,
    "content": 0.20,
}

BRAND_AWARENESS_WEIGHTS = {
    "search": 0.30,
    "reviews": 0.25,
    "social": 0.25,
    "content": 0.20,
}

SEO_RANK_WEIGHTS = {
    "impressions": 0.35,
    "review_volume": 0.25,
    "rating": 0.15,
    "social": 0.15,
    "freshness": 0.10,
}


# ──────────── Trending Keywords by Cuisine ────────────

TRENDING_KEYWORDS: dict[str, list[str]] = {
    "Malaysian": [
        "rendang", "satay", "nasi lemak", "laksa", "roti canai",
        "char kway teow", "sambal", "curry", "coconut", "pandan",
        "malay", "kuih", "teh tarik", "cendol", "belacan",
    ],
    "European": [
        "pasta", "risotto", "tiramisu", "tapas", "croissant",
        "bruschetta", "wine", "cheese", "truffle", "foie gras",
        "steak", "lobster", "caviar", "degustation", "sommelier",
    ],
    "Western": [
        "burger", "steak", "fries", "pizza", "salad",
        "wings", "ribs", "milkshake", "brunch", "eggs benedict",
        "grill", "roast", "buffet", "cocktail", "panoramic",
    ],
    "Indian": [
        "curry", "naan", "biryani", "tandoori", "masala",
        "paneer", "dal", "samosa", "chutney", "spice",
        "kebab", "roti", "lamb", "cardamom", "saffron",
    ],
    "Japanese": [
        "sushi", "ramen", "tempura", "udon", "teriyaki",
        "miso", "sake", "sashimi", "katsu", "matcha",
        "wagyu", "donburi", "yakitori", "soba", "izakaya",
    ],
    "South American": [
        "ceviche", "empanada", "chimichurri", "grill", "cocktail",
        "steak", "rooftop", "guacamole", "arepa", "pisco",
        "churrasco", "moqueca", "feijoada", "caipirinha", "dulce",
    ],
    "general": [
        "best", "top rated", "award", "halal", "vegetarian",
        "vegan", "gluten free", "organic", "local", "authentic",
        "fine dining", "casual", "date night", "family", "weekend",
    ],
}


# ──────────── Trend ────────────

def compute_trend(current: float, previous: float) -> str:
    if previous == 0:
        return "flat"
    pct_change = ((current - previous) / abs(previous)) * 100
    if pct_change > 2:
        return "up"
    if pct_change < -2:
        return "down"
    return "flat"


# ──────────── Visibility Score (0–100) ────────────

def compute_visibility_score(
    search_rank: int,
    avg_rating: float,
    social_rate: float,
    posts_per_week: float,
) -> float:
    """
    Composite score from four weighted sub-scores:

    • search_rank_sub  = max(0, 100 − (rank − 1) × 10)   → rank 1 = 100
    • review_sub       = (avg_rating / 5.0) × 100         → 4.6/5 = 92
    • social_sub       = min(100, social_rate × 20)       → 3.8 % → 76
    • content_sub      = min(100, posts_per_week × 25)    → 3/week → 75
    """
    w = VISIBILITY_WEIGHTS
    search_sub = max(0.0, 100.0 - (search_rank - 1) * 10.0)
    review_sub = (avg_rating / 5.0) * 100.0
    social_sub = min(100.0, social_rate * 20.0)
    content_sub = min(100.0, posts_per_week * 25.0)

    return (
        w["search_rank"] * search_sub
        + w["reviews"] * review_sub
        + w["social"] * social_sub
        + w["content"] * content_sub
    )


# ──────────── Brand Awareness (0–100) ────────────

def compute_brand_awareness(
    search_rank: int,
    total_reviews: int,
    social_engagement_rate: float,
    posts_per_week_avg: float,
) -> float:
    """
    Weighted composite of how many local customers recognise the brand.

    • search_sub   = max(0, 100 − (rank − 1) × 5)        → rank 1 = 100
    • review_sub   = min(100, (reviews / 5000) × 100)     → 5000+ reviews = 100
    • social_sub   = min(100, (engagement_rate / 5) × 100) → 5 %+ = 100
    • content_sub  = min(100, (posts_per_week / 4) × 100)  → 4+/week = 100
    """
    w = BRAND_AWARENESS_WEIGHTS
    search_sub = max(0.0, 100.0 - (search_rank - 1) * 5.0)
    review_sub = min(100.0, (total_reviews / 5000.0) * 100.0)
    social_sub = min(100.0, (social_engagement_rate / 5.0) * 100.0)
    content_sub = min(100.0, (posts_per_week_avg / 4.0) * 100.0)

    return (
        w["search"] * search_sub
        + w["reviews"] * review_sub
        + w["social"] * social_sub
        + w["content"] * content_sub
    )


# ──────────── Local Search Rank (1–20, lower = better) ────────────

def _normalise_rank_factor(value: float, best: float, worst: float) -> float:
    """Map a metric value to a 1.0–20.0 rank factor (lower = better)."""
    if best == worst:
        return 10.0
    ratio = max(0.0, min(1.0, (value - worst) / (best - worst)))
    return 20.0 - ratio * 19.0  # best → 1.0, worst → 20.0


def compute_local_search_rank(
    impressions: int,
    total_reviews: int,
    avg_rating: float,
    social_engagement_rate: float,
    posts_per_week: float,
) -> int:
    """
    Competitive local-search rank derived from five performance dimensions.

    Each dimension is normalised against market benchmarks (best/worst),
    then a weighted-average rank factor is computed.

    Benchmarks:
        Impressions:       120 000 (best)  –  40 000 (worst)
        Review volume:       4 000 (best)  –    500 (worst)
        Rating:                5.0 (best)  –    3.5 (worst)
        Social engagement:   5.0 % (best)  –   2.0 % (worst)
        Content freshness:   5 /wk  (best)  –   1 /wk  (worst)

    Returns an integer rank 1–20 where 1 is best.
    """
    w = SEO_RANK_WEIGHTS

    imp_factor = _normalise_rank_factor(impressions, 120_000, 40_000)
    rev_factor = _normalise_rank_factor(total_reviews, 4_000, 500)
    rat_factor = _normalise_rank_factor(avg_rating, 5.0, 3.5)
    soc_factor = _normalise_rank_factor(social_engagement_rate, 5.0, 2.0)
    fresh_factor = _normalise_rank_factor(posts_per_week, 5.0, 1.0)

    raw = (
        w["impressions"] * imp_factor
        + w["review_volume"] * rev_factor
        + w["rating"] * rat_factor
        + w["social"] * soc_factor
        + w["freshness"] * fresh_factor
    )
    return max(1, min(20, round(raw)))


# ──────────── Keyword Match Rate (0–100 %) ────────────

def compute_keyword_match_rate(
    cuisines: str,
    sample_reviews: Optional[str],
) -> float:
    """
    Percentage of trending cuisine keywords that appear in the
    restaurant's content (cuisines + sample reviews).

    Matches cuisine-specific keywords + general trending keywords
    against the restaurant's full text content.
    """
    keywords = list(TRENDING_KEYWORDS.get(cuisines, []))
    keywords.extend(TRENDING_KEYWORDS.get("general", []))

    if not keywords:
        return 0.0

    content = cuisines.lower()
    if sample_reviews:
        content += " " + sample_reviews.lower()

    matched = 0
    for kw in keywords:
        if re.search(re.escape(kw.lower()), content):
            matched += 1

    return round((matched / len(keywords)) * 100.0, 1)


# ──────────── Content Freshness (posts / week) ────────────

def compute_content_freshness(
    instagram_posts_this_month: int,
    tiktok_posts_this_month: int,
) -> float:
    """
    Average weekly posting frequency across Instagram and TikTok.

    posts_per_week = (instagram_posts + tiktok_posts) / 2 / 4.33
    where 4.33 is the average number of weeks per month.
    """
    total_platforms = 0
    total_posts = 0

    if instagram_posts_this_month > 0:
        total_posts += instagram_posts_this_month
        total_platforms += 1
    if tiktok_posts_this_month > 0:
        total_posts += tiktok_posts_this_month
        total_platforms += 1

    if total_platforms == 0 or total_posts == 0:
        return 0.0

    return round(total_posts / total_platforms / 4.33, 1)
