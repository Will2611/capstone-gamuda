"""Hybrid sentiment analysis — VADER first, LLM on rating/text conflicts."""

from __future__ import annotations

import logging

from src.llm.chains.sentiment_chain import (
    classify_conflict_with_llm,
    classify_conflicts_abatch,
)
from src.llm.conflict_detector import sentiment_from_rating
from src.llm.service import get_llm
from src.llm.vader_sentiment import analyze_review_text

logger = logging.getLogger(__name__)


async def analyze_review(
    text: str,
    rating: int,
    *,
    stats: dict[str, int] | None = None,
    use_llm: bool = True,
) -> dict:
    """Classify one review. Returns dict ready for sentiment_data.reviews JSON."""
    if stats is None:
        stats = {}

    result = analyze_review_text(text, rating)

    if result["source"] == "vader":
        stats["vader"] = stats.get("vader", 0) + 1
        if result["conflict"]:
            stats["conflicts"] = stats.get("conflicts", 0) + 1
            if not use_llm:
                return result
            try:
                llm = get_llm()
                rating_sentiment = sentiment_from_rating(rating)
                text_sentiment = result["sentiment"]
                llm_result = await classify_conflict_with_llm(
                    llm,
                    text,
                    rating,
                    rating_sentiment,
                    text_sentiment,
                )
                result["sentiment"] = llm_result.sentiment
                result["theme"] = llm_result.theme
                result["source"] = "llm"
                stats["llm"] = stats.get("llm", 0) + 1
            except Exception as exc:
                logger.warning("LLM conflict resolution failed, keeping VADER result: %s", exc)
                stats["llm_errors"] = stats.get("llm_errors", 0) + 1
    else:
        stats["rating_only"] = stats.get("rating_only", 0) + 1

    return result


async def analyze_reviews_batch(
    reviews: list[dict],
    *,
    use_llm: bool = True,
    max_concurrency: int = 3,
) -> tuple[list[dict], dict]:
    """Analyze reviews with VADER, then abatch LLM on conflicts only.

    Input items: {text, rating} (optional restaurant_name is preserved).
    """
    stats: dict[str, int] = {
        "total": len(reviews),
        "vader": 0,
        "rating_only": 0,
        "conflicts": 0,
        "llm": 0,
        "llm_errors": 0,
    }
    analyzed: list[dict] = []
    conflict_indices: list[int] = []
    conflict_inputs: list[dict] = []

    for review in reviews:
        text = (review.get("text") or "").strip()
        rating = int(review["rating"])
        restaurant_name = review.get("restaurant_name")

        if not text:
            row = {
                "text": None,
                "rating": rating,
                "sentiment": sentiment_from_rating(rating),
                "theme": "Other",
                "analyzed": True,
                "source": "rating_only",
                "conflict": False,
            }
            if restaurant_name is not None:
                row["restaurant_name"] = restaurant_name
            analyzed.append(row)
            stats["rating_only"] = stats.get("rating_only", 0) + 1
            continue

        result = analyze_review_text(text, rating)
        if restaurant_name is not None:
            result["restaurant_name"] = restaurant_name

        if result["source"] == "vader":
            stats["vader"] = stats.get("vader", 0) + 1
            if result["conflict"]:
                stats["conflicts"] = stats.get("conflicts", 0) + 1
                if use_llm:
                    conflict_indices.append(len(analyzed))
                    conflict_inputs.append({
                        "text": text,
                        "rating": rating,
                        "rating_sentiment": sentiment_from_rating(rating),
                        "text_sentiment": result["sentiment"],
                    })
        else:
            stats["rating_only"] = stats.get("rating_only", 0) + 1

        analyzed.append(result)

    if use_llm and conflict_inputs:
        try:
            llm = get_llm()
            llm_results = await classify_conflicts_abatch(
                llm,
                conflict_inputs,
                max_concurrency=max_concurrency,
            )
            for idx, llm_result in zip(conflict_indices, llm_results):
                if isinstance(llm_result, BaseException):
                    logger.warning(
                        "LLM conflict resolution failed, keeping VADER result: %s",
                        llm_result,
                    )
                    stats["llm_errors"] = stats.get("llm_errors", 0) + 1
                    continue
                analyzed[idx]["sentiment"] = llm_result.sentiment
                analyzed[idx]["theme"] = llm_result.theme
                analyzed[idx]["source"] = "llm"
                stats["llm"] = stats.get("llm", 0) + 1
        except Exception as exc:
            logger.warning("LLM abatch failed, keeping VADER for all conflicts: %s", exc)
            stats["llm_errors"] = stats.get("llm_errors", 0) + len(conflict_inputs)

    return analyzed, stats
