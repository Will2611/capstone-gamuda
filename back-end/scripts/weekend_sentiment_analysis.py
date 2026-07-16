"""
Weekend job — VADER text sentiment + Gemini insights (token-limited).

1. VADER → pie chart % and complaint theme bar counts
2. Gemini → strongly negative reviews only (compound <= -0.3, max 25/restaurant)
3. Store ai_insights for Troubleshoot Center (no live API on dashboard load)

Run from back-end/:  python scripts/weekend_sentiment_analysis.py
"""
import asyncio
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import desc

from src.database.connection import SessionLocal, engine
from src.database.migrate_visibility import ensure_visibility_schema
from src.database.models.visibility import RestaurantVisbilityModel, SentimentDataModel
from src.database.sentiment_helpers import (
    load_reviews_by_restaurant,
    compute_sentiment_pcts,
    replace_complaint_themes,
)
from src.llm.sentiment_analyzer import analyze_reviews_batch
from src.llm.gemini_insights import generate_gemini_insights


async def run_analysis():
    ensure_visibility_schema(engine)
    reviews_by_restaurant = load_reviews_by_restaurant()
    today = date.today()
    db = SessionLocal()
    total_stats = {
        "restaurants": 0,
        "reviews": 0,
        "vader": 0,
        "rating_only": 0,
        "conflicts": 0,
        "gemini_calls": 0,
        "gemini_cached": 0,
    }

    try:
        restaurants = db.query(RestaurantVisbilityModel).all()

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
                pending = reviews_by_restaurant.get(rest.name, [])

            if not pending:
                continue

            analyzed, stats = await analyze_reviews_batch(pending)

            if sentiment:
                sentiment.reviews = analyzed
            else:
                sentiment = SentimentDataModel(
                    restaurant_id=rest.id,
                    recorded_at=today,
                    restaurant_name=rest.name,
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

            insights = await generate_gemini_insights(rest.name, sentiment.reviews)
            if insights is not None:
                sentiment.ai_insights = insights
                if insights.get("from_cache"):
                    total_stats["gemini_cached"] += 1
                elif insights.get("suggestions") and not insights.get("error"):
                    total_stats["gemini_calls"] += 1

            total_stats["restaurants"] += 1
            total_stats["reviews"] += stats["total"]
            for key in ("vader", "rating_only", "conflicts"):
                total_stats[key] += stats.get(key, 0)

        db.commit()
        print("Weekend sentiment analysis complete:")
        print(f"  Restaurants:  {total_stats['restaurants']}")
        print(f"  Reviews:      {total_stats['reviews']}")
        print(f"  VADER:        {total_stats['vader']}")
        print(f"  Rating-only:  {total_stats['rating_only']}")
        print(f"  Conflicts:    {total_stats['conflicts']}")
        print(f"  Gemini calls: {total_stats['gemini_calls']}")
        print(f"  Gemini cache: {total_stats['gemini_cached']}")

    except Exception as exc:
        db.rollback()
        print(f"ERROR: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(run_analysis())
