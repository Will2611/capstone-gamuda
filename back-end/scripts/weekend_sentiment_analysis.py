"""
Weekend job — hybrid VADER + LLM sentiment analysis on pending reviews.

1. VADER compound score → Positive / Negative / Neutral
2. Keyword rules → Wait Time / Taste / Service theme
3. LLM resolves rating vs text conflicts (set LLM_PROVIDER=gemini in .env)
4. Recompute pie chart % and complaint theme bar counts

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
from src.database.models.restaurants import RestaurantModel
from src.database.models.visibility import SentimentDataModel
from src.database.sentiment_helpers import (
    load_reviews_by_restaurant,
    load_reviews_from_db,
    compute_sentiment_pcts,
    replace_complaint_themes,
)
from src.llm.sentiment_analyzer import analyze_reviews_batch


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
                pending = reviews_by_restaurant.get(rest.name, [])
                if not pending:
                    pending = load_reviews_from_db(db, rest.id)

            if not pending:
                continue

            analyzed, stats = await analyze_reviews_batch(pending)

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
        print("Weekend sentiment analysis complete:")
        print(f"  Restaurants:  {total_stats['restaurants']}")
        print(f"  Reviews:      {total_stats['reviews']}")
        print(f"  VADER:        {total_stats['vader']}")
        print(f"  Rating-only:  {total_stats['rating_only']}")
        print(f"  Conflicts:    {total_stats['conflicts']}")
        print(f"  LLM resolved: {total_stats['llm']}")
        if total_stats["llm_errors"]:
            print(f"  LLM errors:   {total_stats['llm_errors']}")

    except Exception as exc:
        db.rollback()
        print(f"ERROR: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(run_analysis())
