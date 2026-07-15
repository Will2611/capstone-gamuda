"""
Seed script — populates visibility dashboard tables with in-house restaurant CSV data.

Run from the back-end folder:
  python seed_visibility.py              # weekday mode (ratings only)
  python seed_visibility.py --analyze    # also run VADER sentiment

Weekday/weekend jobs can be run separately:
  python scripts/weekday_sync_ratings.py
  python scripts/weekend_sentiment_analysis.py
"""
import argparse
import asyncio
from datetime import date, timedelta
from pathlib import Path

from src.database.connection import SessionLocal, engine, Base
from src.database.migrate_visibility import ensure_visibility_schema
from src.database.models.visibility import (
    RestaurantVisbilityModel,
    VisibilityMetricsModel,
    FunnelStageModel,
    SocialPlatformMetricsModel,
    SentimentDataModel,
    ComplaintThemeModel,
    FootTrafficHourlyModel,
    FootTrafficDailyModel,
)
from src.database.sentiment_helpers import (
    load_reviews_by_restaurant,
    build_rating_only_reviews,
    compute_sentiment_pcts,
    compute_avg_rating,
    compute_complaint_theme_counts,
)

# ── Inline CSV data ──────────────────────────────────────
CSV_ROWS = [
    # Restaurant,Visibility,Social Engagement,Reviews Count,Avg Rating,Repeat Visit Rate,
    # Impressions,Clicks,Click-to-Direction,Visits,Sentiment (Pos/Neg),Complaint Theme,
    # SEO Rank,Keyword Match,Content Freshness,Sample Reviews,Longitude,Latitude,Cuisines
    {
        "name": "Beta KL",
        "visibility": 74, "social_eng": 3.90, "reviews_count": 1365, "avg_rating": 4.8,
        "repeat_visit": 68.10, "impressions": 67200, "clicks": 2554, "click_dir": 460,
        "visits": 324, "positive": 82, "negative": 18, "complaint_theme": "Wait Time",
        "longitude": 3.154793, "latitude": 101.709125, "cuisines": "Malaysian",
    },
    {
        "name": "Bijan Bar & Restaurant",
        "visibility": 81, "social_eng": 4.20, "reviews_count": 3002, "avg_rating": 4.5,
        "repeat_visit": 65.40, "impressions": 84500, "clicks": 3120, "click_dir": 590,
        "visits": 410, "positive": 79, "negative": 21, "complaint_theme": "Taste",
        "longitude": 3.148888, "latitude": 101.705993, "cuisines": "Malaysian",
    },
    {
        "name": "Fuego at Troika Sky Dining",
        "visibility": 76, "social_eng": 3.70, "reviews_count": 3381, "avg_rating": 4.7,
        "repeat_visit": 72.00, "impressions": 90200, "clicks": 3400, "click_dir": 720,
        "visits": 500, "positive": 85, "negative": 15, "complaint_theme": "Service",
        "longitude": 3.158625, "latitude": 101.71816, "cuisines": "South American",
    },
    {
        "name": "Skillet KL",
        "visibility": 69, "social_eng": 3.50, "reviews_count": 1127, "avg_rating": 4.6,
        "repeat_visit": 66.80, "impressions": 54100, "clicks": 2100, "click_dir": 380,
        "visits": 270, "positive": 80, "negative": 20, "complaint_theme": "Wait Time",
        "longitude": 3.153259, "latitude": 101.707512, "cuisines": "European",
    },
    {
        "name": "THIRTY8 Restaurant, Bar & Lounge",
        "visibility": 88, "social_eng": 4.50, "reviews_count": 3914, "avg_rating": 4.4,
        "repeat_visit": 70.20, "impressions": 120300, "clicks": 4500, "click_dir": 890,
        "visits": 640, "positive": 78, "negative": 22, "complaint_theme": "Taste",
        "longitude": 3.153863, "latitude": 101.712326, "cuisines": "Western",
    },
    {
        "name": "Sabayon at EQ",
        "visibility": 77, "social_eng": 3.80, "reviews_count": 1434, "avg_rating": 4.7,
        "repeat_visit": 67.90, "impressions": 61000, "clicks": 2300, "click_dir": 420,
        "visits": 310, "positive": 83, "negative": 17, "complaint_theme": "Service",
        "longitude": 3.153132, "latitude": 101.709758, "cuisines": "European",
    },
    {
        "name": "Bunglow37",
        "visibility": 72, "social_eng": 3.60, "reviews_count": 3160, "avg_rating": 4.6,
        "repeat_visit": 69.50, "impressions": 78000, "clicks": 2950, "click_dir": 560,
        "visits": 390, "positive": 81, "negative": 19, "complaint_theme": "Wait Time",
        "longitude": 3.132541, "latitude": 101.677107, "cuisines": "European",
    },
    {
        "name": "RESTORAN SENTRAL SPICE",
        "visibility": 85, "social_eng": 4.10, "reviews_count": 926, "avg_rating": 4.7,
        "repeat_visit": 73.30, "impressions": 50500, "clicks": 1900, "click_dir": 350,
        "visits": 250, "positive": 84, "negative": 16, "complaint_theme": "Taste",
        "longitude": 3.129515, "latitude": 101.68604, "cuisines": "Indian",
    },
    {
        "name": "NADODI",
        "visibility": 79, "social_eng": 3.90, "reviews_count": 928, "avg_rating": 4.7,
        "repeat_visit": 71.00, "impressions": 52000, "clicks": 2000, "click_dir": 370,
        "visits": 260, "positive": 82, "negative": 18, "complaint_theme": "Service",
        "longitude": 3.158137, "latitude": 101.713717, "cuisines": "Indian",
    },
    {
        "name": "PRIME, Le Méridien Kuala Lumpur",
        "visibility": 73, "social_eng": 3.40, "reviews_count": 658, "avg_rating": 4.4,
        "repeat_visit": 64.70, "impressions": 43000, "clicks": 1650, "click_dir": 310,
        "visits": 220, "positive": 77, "negative": 23, "complaint_theme": "Wait Time",
        "longitude": 3.136899, "latitude": 101.686263, "cuisines": "Japanese",
    },
]


FUNNEL_STAGES = ["Impressions", "Clicks", "Click-to-Direction"]


async def run_weekend_analysis(db):
    """Run hybrid sentiment on all restaurants after seed."""
    from sqlalchemy import desc
    from src.llm.sentiment_analyzer import analyze_reviews_batch
    from src.database.sentiment_helpers import replace_complaint_themes

    restaurants = db.query(RestaurantVisbilityModel).all()
    for rest in restaurants:
        sentiment = (
            db.query(SentimentDataModel)
            .filter(SentimentDataModel.restaurant_id == rest.id)
            .order_by(desc(SentimentDataModel.recorded_at))
            .first()
        )
        if not sentiment or not sentiment.reviews:
            continue

        pending = [
            {"text": r.get("text") or "", "rating": r["rating"]}
            for r in sentiment.reviews
        ]
        if not pending:
            continue

        analyzed, _ = await analyze_reviews_batch(pending)
        sentiment.reviews = analyzed
        pos, neg, neu = compute_sentiment_pcts(analyzed)
        sentiment.positive_pct = pos
        sentiment.negative_pct = neg
        sentiment.neutral_pct = neu
        replace_complaint_themes(db, sentiment, analyzed)


async def seed(*, run_analysis: bool = False):
    Base.metadata.drop_all(bind=engine, tables=[
        t for t in Base.metadata.sorted_tables
        if t.name in {
            "restaurants_measured", "visibility_metrics", "funnel_stages",
            "social_platform_metrics", "sentiment_data", "complaint_themes",
            "foot_traffic_hourly", "foot_traffic_daily",
        }
    ])
    Base.metadata.create_all(bind=engine)
    ensure_visibility_schema(engine)

    db = SessionLocal()
    reviews_by_restaurant = load_reviews_by_restaurant()
    try:
        today = date.today()
        prev_month = today - timedelta(days=30)

        for row in CSV_ROWS:
            # ── Restaurant ──
            rest = RestaurantVisbilityModel(
                name=row["name"],
                cuisines=row["cuisines"],
                latitude=row["latitude"],
                longitude=row["longitude"],
            )
            db.add(rest)
            db.flush()

            # ── Visibility metrics (current month) ──
            db.add(VisibilityMetricsModel(
                restaurant_id=rest.id, recorded_at=today,
                visibility_score=row["visibility"],
                average_rating=row["avg_rating"],
                total_reviews=row["reviews_count"],
                rating_source="Google",
                social_engagement_rate=row["social_eng"],
                repeat_visit_rate=row["repeat_visit"],
            ))
            # Previous month (slightly lower values for trend calculation)
            prev_social = round(row["social_eng"] * (0.85 + (row["visibility"] / 200)), 2)
            prev_repeat = round(row["repeat_visit"] * (0.85 + (row["visibility"] / 200)), 1)
            db.add(VisibilityMetricsModel(
                restaurant_id=rest.id, recorded_at=prev_month,
                visibility_score=max(0, row["visibility"] - 3),
                average_rating=row["avg_rating"],
                total_reviews=max(1, row["reviews_count"] - 12),
                rating_source="Google",
                social_engagement_rate=prev_social,
                repeat_visit_rate=prev_repeat,
            ))

            # ── Funnel stages ──
            counts = [
                (FUNNEL_STAGES[0], row["impressions"], 100.0, False),
                (FUNNEL_STAGES[1], row["clicks"],
                 round(row["clicks"] / row["impressions"] * 100, 1), False),
                (FUNNEL_STAGES[2], row["click_dir"],
                 round(row["click_dir"] / row["clicks"] * 100, 1), True),
            ]
            for name, cnt, conv, drop in counts:
                db.add(FunnelStageModel(
                    restaurant_id=rest.id, recorded_at=today,
                    stage_name=name, count=cnt, conversion=conv, is_drop_off=drop,
                ))

            # ── Google Reviews social card ──
            db.add(SocialPlatformMetricsModel(
                restaurant_id=rest.id, recorded_at=today,
                platform="google",
                avg_rating=row["avg_rating"],
                total_reviews=row["reviews_count"],
                engagement_rate=round(row["social_eng"] * 0.6, 1),
                url="https://www.google.com/maps",
            ))

            # ── Sentiment (restaurant-reviews_latest.csv — weekday ratings first) ──
            csv_reviews = reviews_by_restaurant.get(row["name"], [])
            rating_only_reviews = build_rating_only_reviews(csv_reviews) if csv_reviews else []

            if csv_reviews:
                avg_from_csv = compute_avg_rating(csv_reviews)
                review_count = len(csv_reviews)
            else:
                avg_from_csv = row["avg_rating"]
                review_count = row["reviews_count"]

            positive_pct = row["positive"]
            negative_pct = row["negative"]
            neutral_pct = round(100 - positive_pct - negative_pct, 1)

            sent = SentimentDataModel(
                restaurant_id=rest.id,
                recorded_at=today,
                restaurant_name=row["name"],
                positive_pct=positive_pct,
                negative_pct=negative_pct,
                neutral_pct=neutral_pct,
                reviews=rating_only_reviews or None,
            )
            db.add(sent)
            db.flush()

            theme_counts = compute_complaint_theme_counts(
                [r for r in rating_only_reviews if r.get("sentiment")]
            )
            if theme_counts:
                for theme, count in theme_counts[:5]:
                    db.add(ComplaintThemeModel(
                        sentiment_id=sent.id, theme=theme, count=count,
                    ))
            else:
                db.add(ComplaintThemeModel(
                    sentiment_id=sent.id, theme=row["complaint_theme"],
                    count=max(2, int((row["negative"] / 100) * 30)),
                ))
                secondary_themes = {
                    "Wait Time": "Service",
                    "Taste": "Wait Time",
                    "Service": "Taste",
                }
                db.add(ComplaintThemeModel(
                    sentiment_id=sent.id,
                    theme=secondary_themes.get(row["complaint_theme"], "Taste"),
                    count=max(1, int((row["negative"] / 100) * 18)),
                ))

            # ── Foot Traffic ──
            scale = row["visibility"] / 100.0
            # foot_traffic_hourly = [   * REMOVE
            #     ("Monday", "Weekday", 12, int(45 * scale)),
            #     ("Monday", "Weekday", 13, int(55 * scale)),
            #     ("Monday", "Weekday", 19, int(80 * scale)),
            #     ("Tuesday", "Weekday", 12, int(50 * scale)),
            #     ("Tuesday", "Weekday", 13, int(60 * scale)),
            #     ("Tuesday", "Weekday", 19, int(85 * scale)),
            #     ("Wednesday", "Weekday", 12, int(48 * scale)),
            #     ("Wednesday", "Weekday", 13, int(58 * scale)),
            #     ("Wednesday", "Weekday", 19, int(82 * scale)),
            #     ("Thursday", "Weekday", 12, int(52 * scale)),
            #     ("Thursday", "Weekday", 13, int(65 * scale)),
            #     ("Thursday", "Weekday", 19, int(90 * scale)),
            #     ("Friday", "Weekday", 12, int(60 * scale)),
            #     ("Friday", "Weekday", 13, int(70 * scale)),
            #     ("Friday", "Weekday", 19, int(100 * scale)),
            #     ("Saturday", "Weekend", 12, int(95 * scale)),
            #     ("Saturday", "Weekend", 13, int(120 * scale)),
            #     ("Saturday", "Weekend", 19, int(160 * scale)),
            #     ("Sunday", "Weekend", 12, int(85 * scale)),
            #     ("Sunday", "Weekend", 13, int(110 * scale)),
            #     ("Sunday", "Weekend", 19, int(145 * scale)),
            # ]
            # for day_n, day_t, hr, vis in foot_traffic_hourly:
            #     db.add(FootTrafficHourlyModel(
            #         restaurant=rest,
            #         traffic_date=today,
            #         day_name=day_n,
            #         day_type=day_t,
            #         hour=hr,
            #         visitors=max(1, vis),
            #     ))

            foot_traffic_daily = [
                ("Monday", "Weekday", int(85 * scale)),
                ("Tuesday", "Weekday", int(92 * scale)),
                ("Wednesday", "Weekday", int(88 * scale)),
                ("Thursday", "Weekday", int(95 * scale)),
                ("Friday", "Weekday", int(110 * scale)),
                ("Saturday", "Weekend", int(160 * scale)),
                ("Sunday", "Weekend", int(145 * scale)),
            ]
            for day_n, day_t, vis in foot_traffic_daily:
                db.add(FootTrafficDailyModel(
                    restaurant_id=rest.id,
                    traffic_date=today,
                    day_name=day_n,
                    day_type=day_t,
                    visits=max(1, vis),
                ))

        if run_analysis:
            print("Running VADER sentiment analysis...")
            await run_weekend_analysis(db)
            print("Sentiment analysis complete.")

        db.commit()
        print(f"Seeded {len(CSV_ROWS)} restaurants successfully.")
        if not run_analysis:
            print("Tip: run  python seed_visibility.py --analyze  or  scripts/weekend_sentiment_analysis.py")

    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
        raise
    finally:
        db.close()


async def main():
    parser = argparse.ArgumentParser(description="Seed visibility dashboard tables")
    parser.add_argument(
        "--analyze",
        action="store_true",
        help="Run VADER sentiment analysis after seed",
    )
    args = parser.parse_args()
    await seed(run_analysis=args.analyze)


if __name__ == "__main__":
    asyncio.run(main())
