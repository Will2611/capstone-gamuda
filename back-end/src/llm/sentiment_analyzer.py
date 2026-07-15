"""VADER-based sentiment analysis — no LLM calls."""

from __future__ import annotations

from src.llm.conflict_detector import sentiment_from_rating
from src.llm.vader_sentiment import analyze_review_text


async def analyze_review(
    text: str,
    rating: int,
    *,
    stats: dict[str, int] | None = None,
) -> dict:
    """Classify one review. Returns dict ready for sentiment_data.reviews JSON."""
    if stats is None:
        stats = {}

    result = analyze_review_text(text, rating)

    if result["source"] == "vader":
        stats["vader"] = stats.get("vader", 0) + 1
        if result["conflict"]:
            stats["conflicts"] = stats.get("conflicts", 0) + 1
    else:
        stats["rating_only"] = stats.get("rating_only", 0) + 1

    return result


async def analyze_reviews_batch(reviews: list[dict]) -> tuple[list[dict], dict]:
    """Analyze reviews. Input: {text, rating} or partial."""
    stats: dict[str, int] = {
        "total": len(reviews),
        "vader": 0,
        "rating_only": 0,
        "conflicts": 0,
    }
    analyzed: list[dict] = []

    for review in reviews:
        text = (review.get("text") or "").strip()
        rating = int(review["rating"])
        if not text:
            analyzed.append({
                "text": None,
                "rating": rating,
                "sentiment": sentiment_from_rating(rating),
                "theme": "Other",
                "analyzed": True,
                "source": "rating_only",
                "conflict": False,
            })
            stats["rating_only"] = stats.get("rating_only", 0) + 1
            continue
        result = await analyze_review(text, rating, stats=stats)
        analyzed.append(result)

    return analyzed, stats
