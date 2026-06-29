"""
Seed script — populates visibility dashboard tables with in-house restaurant CSV data.
Run from the back-end folder with:  myenv\Scripts\python seed_visibility.py
"""
from datetime import date, timedelta
from src.database.connection import SessionLocal, engine, Base
from src.database.schemas.visibility import (
    RestaurantModel,
    VisibilityMetricsModel,
    FunnelStageModel,
    SocialPlatformMetricsModel,
    SentimentDataModel,
    ComplaintThemeModel,
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
        "seo_rank": 7, "keyword_match": 62, "freshness": 2.5,
        "reviews": "1. \"The tasting menu was exquisite — every dish felt like art.\" | 2. \"Ambience is modern yet warm. Perfect for date nights.\" | 3. \"Waited too long between courses, which spoiled the flow.\" | 4. \"Staff were attentive and explained each dish beautifully.\" | 5. \"Parking was a hassle, but food was worth it.\"",
        "longitude": 3.154793, "latitude": 101.709125, "cuisines": "Malaysian",
    },
    {
        "name": "Bijan Bar & Restaurant",
        "visibility": 81, "social_eng": 4.20, "reviews_count": 3002, "avg_rating": 4.5,
        "repeat_visit": 65.40, "impressions": 84500, "clicks": 3120, "click_dir": 590,
        "visits": 410, "positive": 79, "negative": 21, "complaint_theme": "Taste",
        "seo_rank": 5, "keyword_match": 70, "freshness": 3,
        "reviews": "1. \"Authentic Malay flavors with a fine-dining twist. Loved it!\" | 2. \"The rendang was rich and flavorful, highly recommended.\" | 3. \"Portions felt small for the price.\" | 4. \"Service was friendly and quick, made us feel welcome.\" | 5. \"Desserts were average compared to mains.\"",
        "longitude": 3.148888, "latitude": 101.705993, "cuisines": "Malaysian",
    },
    {
        "name": "Fuego at Troika Sky Dining",
        "visibility": 76, "social_eng": 3.70, "reviews_count": 3381, "avg_rating": 4.7,
        "repeat_visit": 72.00, "impressions": 90200, "clicks": 3400, "click_dir": 720,
        "visits": 500, "positive": 85, "negative": 15, "complaint_theme": "Service",
        "seo_rank": 9, "keyword_match": 58, "freshness": 2,
        "reviews": "1. \"The rooftop view is unbeatable — KL skyline at its best.\" | 2. \"Cocktails were creative and refreshing.\" | 3. \"Service was slow despite reservations.\" | 4. \"Loved the grilled meats, perfectly cooked.\" | 5. \"Music was too loud for conversation.\"",
        "longitude": 3.158625, "latitude": 101.71816, "cuisines": "South American",
    },
    {
        "name": "Skillet KL",
        "visibility": 69, "social_eng": 3.50, "reviews_count": 1127, "avg_rating": 4.6,
        "repeat_visit": 66.80, "impressions": 54100, "clicks": 2100, "click_dir": 380,
        "visits": 270, "positive": 80, "negative": 20, "complaint_theme": "Wait Time",
        "seo_rank": 11, "keyword_match": 55, "freshness": 1.5,
        "reviews": "1. \"Innovative dishes with bold flavors, truly memorable.\" | 2. \"The lunch menu is great value for money.\" | 3. \"Wait time between starters and mains was frustrating.\" | 4. \"Staff were knowledgeable about wine pairings.\" | 5. \"Dessert presentation was stunning but taste average.\"",
        "longitude": 3.153259, "latitude": 101.707512, "cuisines": "European",
    },
    {
        "name": "THIRTY8 Restaurant, Bar & Lounge",
        "visibility": 88, "social_eng": 4.50, "reviews_count": 3914, "avg_rating": 4.4,
        "repeat_visit": 70.20, "impressions": 120300, "clicks": 4500, "click_dir": 890,
        "visits": 640, "positive": 78, "negative": 22, "complaint_theme": "Taste",
        "seo_rank": 4, "keyword_match": 75, "freshness": 3.5,
        "reviews": "1. \"Panoramic views and elegant dining — perfect for celebrations.\" | 2. \"Breakfast buffet was diverse and delicious.\" | 3. \"Taste didn't match the premium pricing.\" | 4. \"Service was polished and professional.\" | 5. \"Crowded during weekends, felt rushed.\"",
        "longitude": 3.153863, "latitude": 101.712326, "cuisines": "Western",
    },
    {
        "name": "Sabayon at EQ",
        "visibility": 77, "social_eng": 3.80, "reviews_count": 1434, "avg_rating": 4.7,
        "repeat_visit": 67.90, "impressions": 61000, "clicks": 2300, "click_dir": 420,
        "visits": 310, "positive": 83, "negative": 17, "complaint_theme": "Service",
        "seo_rank": 8, "keyword_match": 63, "freshness": 2.8,
        "reviews": "1. \"Romantic setting with beautifully plated dishes.\" | 2. \"Wine list was extensive and well-curated.\" | 3. \"Service felt inattentive at times.\" | 4. \"Loved the Sunday brunch, especially desserts.\" | 5. \"Portions could be more generous.\"",
        "longitude": 3.153132, "latitude": 101.709758, "cuisines": "European",
    },
    {
        "name": "Bunglow37",
        "visibility": 72, "social_eng": 3.60, "reviews_count": 3160, "avg_rating": 4.6,
        "repeat_visit": 69.50, "impressions": 78000, "clicks": 2950, "click_dir": 560,
        "visits": 390, "positive": 81, "negative": 19, "complaint_theme": "Wait Time",
        "seo_rank": 10, "keyword_match": 60, "freshness": 2.2,
        "reviews": "1. \"Charming atmosphere with cozy interiors.\" | 2. \"Great spot for group dinners, spacious and lively.\" | 3. \"Wait time for mains was longer than expected.\" | 4. \"Cocktails were creative and well-balanced.\" | 5. \"Music was slightly too loud indoors.\"",
        "longitude": 3.132541, "latitude": 101.677107, "cuisines": "European",
    },
    {
        "name": "RESTORAN SENTRAL SPICE",
        "visibility": 85, "social_eng": 4.10, "reviews_count": 926, "avg_rating": 4.7,
        "repeat_visit": 73.30, "impressions": 50500, "clicks": 1900, "click_dir": 350,
        "visits": 250, "positive": 84, "negative": 16, "complaint_theme": "Taste",
        "seo_rank": 6, "keyword_match": 68, "freshness": 3.1,
        "reviews": "1. \"Authentic Malaysian flavors, reminded me of home cooking.\" | 2. \"Service was quick and friendly.\" | 3. \"Taste was inconsistent across dishes.\" | 4. \"Loved the spice blends, very aromatic.\" | 5. \"Ambience felt basic compared to food quality.\"",
        "longitude": 3.129515, "latitude": 101.68604, "cuisines": "Indian",
    },
    {
        "name": "NADODI",
        "visibility": 79, "social_eng": 3.90, "reviews_count": 928, "avg_rating": 4.7,
        "repeat_visit": 71.00, "impressions": 52000, "clicks": 2000, "click_dir": 370,
        "visits": 260, "positive": 82, "negative": 18, "complaint_theme": "Service",
        "seo_rank": 12, "keyword_match": 59, "freshness": 2.4,
        "reviews": "1. \"Creative South Indian fine dining, truly unique.\" | 2. \"Loved the storytelling behind each course.\" | 3. \"Service was slow despite reservations.\" | 4. \"Flavors were bold and memorable.\" | 5. \"Menu felt limited for vegetarians.\"",
        "longitude": 3.158137, "latitude": 101.713717, "cuisines": "Indian",
    },
    {
        "name": "PRIME, Le Méridien Kuala Lumpur",
        "visibility": 73, "social_eng": 3.40, "reviews_count": 658, "avg_rating": 4.4,
        "repeat_visit": 64.70, "impressions": 43000, "clicks": 1650, "click_dir": 310,
        "visits": 220, "positive": 77, "negative": 23, "complaint_theme": "Wait Time",
        "seo_rank": 13, "keyword_match": 57, "freshness": 1.8,
        "reviews": "1. \"Steaks were cooked to perfection, juicy and flavorful.\" | 2. \"Elegant ambience, perfect for business dinners.\" | 3. \"Wait time for food was longer than expected.\" | 4. \"Staff were attentive and professional.\" | 5. \"Side dishes didn't match the quality of mains.\"",
        "longitude": 3.136899, "latitude": 101.686263, "cuisines": "Japanese",
    },
]


FUNNEL_STAGES = ["Impressions", "Clicks", "Click-to-Direction", "Visits", "Reviews"]


def seed():
    Base.metadata.drop_all(bind=engine, tables=[
        t for t in Base.metadata.sorted_tables
        if t.name in {
            "restaurants", "visibility_metrics", "funnel_stages",
            "social_platform_metrics", "sentiment_data", "complaint_themes",
        }
    ])
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        today = date.today()
        prev_month = today - timedelta(days=30)

        for row in CSV_ROWS:
            # ── Restaurant ──
            rest = RestaurantModel(
                name=row["name"],
                cuisines=row["cuisines"],
                latitude=row["latitude"],
                longitude=row["longitude"],
                sample_reviews=row["reviews"],
                review_ratings=row.get("ratings", [5, 4, 3, 5, 3]),
            )
            db.add(rest)
            db.flush()

            # ── Visibility metrics (current month) ──
            db.add(VisibilityMetricsModel(
                restaurant=rest, recorded_at=today,
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
                restaurant=rest, recorded_at=prev_month,
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
                (FUNNEL_STAGES[3], row["visits"],
                 round(row["visits"] / row["click_dir"] * 100, 1), False),
                (FUNNEL_STAGES[4], int(row["visits"] * 0.08),
                 round((row["visits"] * 0.08) / row["visits"] * 100, 1), False),
            ]
            for name, cnt, conv, drop in counts:
                db.add(FunnelStageModel(
                    restaurant=rest, recorded_at=today,
                    stage_name=name, count=cnt, conversion=conv, is_drop_off=drop,
                ))

            # ── Social platform metrics ──
            platforms_data = [
                ("google", row["avg_rating"], row["reviews_count"],
                 max(3, int(row["freshness"] * 3)),
                 round(row["social_eng"] * 0.6, 1),
                 "https://www.google.com/maps"),
                ("instagram", None, None,
                 max(2, int(row["freshness"] * 2)),
                 round(row["social_eng"] * 0.8, 1),
                 "https://www.instagram.com"),
                ("tiktok", None, None,
                 max(1, int(row["freshness"] * 1.5)),
                 round(row["social_eng"] * 0.5, 1),
                 "https://www.tiktok.com"),
            ]
            for plat, ar, tr, ptm, er, url in platforms_data:
                db.add(SocialPlatformMetricsModel(
                    restaurant=rest, recorded_at=today,
                    platform=plat, avg_rating=ar, total_reviews=tr,
                    posts_this_month=ptm, engagement_rate=er, url=url,
                ))

            # ── Sentiment + Complaint ──
            sent = SentimentDataModel(
                restaurant=rest, recorded_at=today,
                positive_pct=row["positive"],
                negative_pct=row["negative"],
                brand_awareness_pct=round(row["visibility"] * 0.85, 1),
                brand_awareness_change=round(row["visibility"] * 0.05, 1),
                local_search_rank=row["seo_rank"],
                search_rank_change=(-1 if row["seo_rank"] > 8 else 1 if row["seo_rank"] < 6 else 0),
                keyword_match_rate=row["keyword_match"],
                posts_per_week_avg=row["freshness"],
            )
            db.add(sent)
            db.flush()

            db.add(ComplaintThemeModel(
                sentiment=sent, theme=row["complaint_theme"],
                count=max(2, int((row["negative"] / 100) * 30)),
            ))
            # Secondary complaint
            secondary_themes = {"Wait Time": "Service", "Taste": "Wait Time", "Service": "Taste"}
            db.add(ComplaintThemeModel(
                sentiment=sent,
                theme=secondary_themes.get(row["complaint_theme"], "Taste"),
                count=max(1, int((row["negative"] / 100) * 18)),
            ))

        db.commit()
        print(f"Seeded {len(CSV_ROWS)} restaurants successfully.")

    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
