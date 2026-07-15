"""
Weekday job — sync star ratings from restaurant-reviews_latest.csv.

Updates visibility_metrics (avg rating, review count) and sentiment_data
with rating-only review rows (analyzed=false). No LLM calls.

Run from back-end/:  python scripts/weekday_sync_ratings.py
"""
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import desc

from src.database.connection import SessionLocal
from src.database.migrate_visibility import ensure_visibility_schema
from src.database.connection import engine
from src.database.models.visibility import (
    RestaurantVisbilityModel,
    VisibilityMetricsModel,
    SocialPlatformMetricsModel,
    SentimentDataModel,
)
from src.database.sentiment_helpers import (
    load_reviews_by_restaurant,
    build_rating_only_reviews,
    compute_avg_rating,
    replace_complaint_themes,
)


def sync_ratings():
    ensure_visibility_schema(engine)
    reviews_by_restaurant = load_reviews_by_restaurant()
    today = date.today()
    db = SessionLocal()

    try:
        restaurants = db.query(RestaurantVisbilityModel).all()
        updated = 0

        for rest in restaurants:
            csv_reviews = reviews_by_restaurant.get(rest.name, [])
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
                    restaurant_name=rest.name,
                    positive_pct=0.0,
                    negative_pct=0.0,
                    neutral_pct=0.0,
                    reviews=rating_only,
                )
                db.add(sentiment)

            replace_complaint_themes(db, sentiment, [])
            updated += 1

        db.commit()
        print(f"Weekday sync complete: {updated} restaurants updated (ratings only).")
        print("Run scripts/weekend_sentiment_analysis.py on weekends for text sentiment.")

    except Exception as exc:
        db.rollback()
        print(f"ERROR: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    sync_ratings()
