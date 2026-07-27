"""
Combined sentiment pipeline — cloud-friendly job module.

Steps (safe order for charts):
  1) sync_ratings   — avg rating / review count from CSV (no LLM)
  2) run_sentiment_analysis — VADER (+ optional LLM) → pie % + themes

Use RestaurantModel (UUID) so FKs on visibility/sentiment tables match.

Entry examples:
  python -m src.jobs.sentiment_pipeline
  python -m src.jobs.sentiment_pipeline --with-llm
  python scripts/run_sentiment_pipeline.py
  python scripts/weekday_sync_ratings.py          # wrapper → sync_ratings only
  python scripts/weekend_sentiment_analysis.py    # wrapper → analysis only
"""
from __future__ import annotations

import argparse
import asyncio
from datetime import date

from sqlalchemy import desc

from src.database.connection import SessionLocal, engine
from src.database.migrate_visibility import ensure_visibility_schema
from src.database.models.restaurants import RestaurantModel
from src.database.models.visibility import (
    SentimentDataModel,
    SocialPlatformMetricsModel,
    VisibilityMetricsModel,
)
from src.database.sentiment_helpers import (
    build_rating_only_reviews,
    compute_avg_rating,
    compute_sentiment_pcts,
    load_reviews_by_restaurant,
    load_reviews_from_db,
    replace_complaint_themes,
)
from src.llm.sentiment_analyzer import analyze_reviews_batch


def sync_ratings(*, reviews_by_restaurant: dict | None = None) -> dict:
    """
    Weekday step: sync star ratings + review counts.
    Replaces sentiment.reviews with rating-only rows and clears complaint themes.
    Call run_sentiment_analysis afterward in the same pipeline so charts refill.
    """
    ensure_visibility_schema(engine)
    grouped = reviews_by_restaurant if reviews_by_restaurant is not None else load_reviews_by_restaurant()
    today = date.today()
    db = SessionLocal()
    updated = 0

    try:
        restaurants = db.query(RestaurantModel).order_by(RestaurantModel.name).all()

        for rest in restaurants:
            csv_reviews = grouped.get(rest.name, [])
            if not csv_reviews:
                continue

            avg_rating = compute_avg_rating(csv_reviews)
            total = len(csv_reviews)
            rating_only = build_rating_only_reviews(csv_reviews)

            metrics = (
                db.query(VisibilityMetricsModel)
                .filter(VisibilityMetricsModel.restaurant_id == rest.id)
                .order_by(desc(VisibilityMetricsModel.recorded_at))
                .first()
            )
            if metrics:
                metrics.average_rating = avg_rating
                metrics.total_reviews = total
                metrics.recorded_at = today

            social = (
                db.query(SocialPlatformMetricsModel)
                .filter(
                    SocialPlatformMetricsModel.restaurant_id == rest.id,
                    SocialPlatformMetricsModel.platform == "google",
                )
                .order_by(desc(SocialPlatformMetricsModel.recorded_at))
                .first()
            )
            if social:
                social.avg_rating = avg_rating
                social.total_reviews = total
                social.recorded_at = today

            sentiment = (
                db.query(SentimentDataModel)
                .filter(SentimentDataModel.restaurant_id == rest.id)
                .order_by(desc(SentimentDataModel.recorded_at))
                .first()
            )
            if sentiment:
                sentiment.reviews = rating_only
                sentiment.recorded_at = today
            else:
                sentiment = SentimentDataModel(
                    restaurant_id=rest.id,
                    recorded_at=today,
                    positive_pct=0.0,
                    negative_pct=0.0,
                    neutral_pct=0.0,
                    reviews=rating_only,
                )
                db.add(sentiment)

            replace_complaint_themes(db, sentiment, [])
            updated += 1

        db.commit()
        print(f"Ratings sync complete: {updated} restaurants updated (ratings only).")
        return {"restaurants_updated": updated}
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


async def run_sentiment_analysis(
    *,
    use_llm: bool = True,
    reviews_by_restaurant: dict | None = None,
) -> dict:
    """
    Weekend step: analyze review text → pie % + complaint themes.
    """
    ensure_visibility_schema(engine)
    grouped = reviews_by_restaurant if reviews_by_restaurant is not None else load_reviews_by_restaurant()
    today = date.today()
    db = SessionLocal()
    total_stats = {
        "restaurants": 0,
        "reviews": 0,
        "vader": 0,
        "rating_only": 0,
        "conflicts": 0,
        "llm": 0,
        "llm_errors": 0,
    }

    try:
        restaurants = db.query(RestaurantModel).order_by(RestaurantModel.name).all()

        for rest in restaurants:
            sentiment = (
                db.query(SentimentDataModel)
                .filter(SentimentDataModel.restaurant_id == rest.id)
                .order_by(desc(SentimentDataModel.recorded_at))
                .first()
            )

            if sentiment and sentiment.reviews:
                pending = [
                    {"text": review.get("text") or "", "rating": review["rating"]}
                    for review in sentiment.reviews
                ]
            else:
                pending = grouped.get(rest.name, [])
                if not pending:
                    pending = load_reviews_from_db(db, rest.id)

            if not pending:
                continue

            analyzed, stats = await analyze_reviews_batch(pending, use_llm=use_llm)

            if sentiment:
                sentiment.reviews = analyzed
            else:
                sentiment = SentimentDataModel(
                    restaurant_id=rest.id,
                    recorded_at=today,
                    positive_pct=0.0,
                    negative_pct=0.0,
                    neutral_pct=0.0,
                    reviews=analyzed,
                )
                db.add(sentiment)

            pos, neg, neu = compute_sentiment_pcts(sentiment.reviews)
            sentiment.positive_pct = pos
            sentiment.negative_pct = neg
            sentiment.neutral_pct = neu
            sentiment.recorded_at = today

            replace_complaint_themes(db, sentiment, sentiment.reviews)

            total_stats["restaurants"] += 1
            total_stats["reviews"] += stats["total"]
            for key in ("vader", "rating_only", "conflicts", "llm", "llm_errors"):
                total_stats[key] += stats.get(key, 0)

        db.commit()
        print("Sentiment analysis complete:")
        print(f"  Restaurants:  {total_stats['restaurants']}")
        print(f"  Reviews:      {total_stats['reviews']}")
        print(f"  VADER:        {total_stats['vader']}")
        print(f"  Rating-only:  {total_stats['rating_only']}")
        print(f"  Conflicts:    {total_stats['conflicts']}")
        print(f"  LLM resolved: {total_stats['llm']}")
        if total_stats["llm_errors"]:
            print(f"  LLM errors:   {total_stats['llm_errors']}")
        return total_stats
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def run_pipeline(
    *,
    skip_llm: bool = True,
    ratings_only: bool = False,
    sentiment_only: bool = False,
) -> dict:
    """
    Combined job for demo/cloud: ratings sync then sentiment analysis.
    Default skip_llm=True for stable, cheaper runs.
    """
    if ratings_only and sentiment_only:
        raise ValueError("Choose at most one of ratings_only / sentiment_only")

    ensure_visibility_schema(engine)
    grouped = load_reviews_by_restaurant()
    result: dict = {"ratings": None, "sentiment": None}

    if not sentiment_only:
        result["ratings"] = sync_ratings(reviews_by_restaurant=grouped)

    if not ratings_only:
        result["sentiment"] = asyncio.run(
            run_sentiment_analysis(
                use_llm=not skip_llm,
                reviews_by_restaurant=grouped,
            )
        )

    print(
        "Pipeline complete "
        f"(ratings_only={ratings_only}, sentiment_only={sentiment_only}, skip_llm={skip_llm})."
    )
    return result


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Combined ratings + sentiment pipeline (cloud-friendly).",
    )
    parser.add_argument(
        "--with-llm",
        action="store_true",
        help="Enable LLM on rating/text conflicts (default: skip LLM).",
    )
    parser.add_argument(
        "--ratings-only",
        action="store_true",
        help="Only sync ratings (weekday behavior).",
    )
    parser.add_argument(
        "--sentiment-only",
        action="store_true",
        help="Only run sentiment analysis (weekend behavior).",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    run_pipeline(
        skip_llm=not args.with_llm,
        ratings_only=args.ratings_only,
        sentiment_only=args.sentiment_only,
    )
