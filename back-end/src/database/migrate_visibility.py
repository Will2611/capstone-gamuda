"""
Apply visibility schema changes to an existing database.

create_all() only creates missing tables — it does not add new columns.
Run this on startup so sentiment_data picks up restaurant_name, neutral_pct, reviews.
"""
from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def ensure_visibility_schema(engine: Engine) -> None:
    inspector = inspect(engine)
    if not inspector.has_table("sentiment_data"):
        return

    existing = {col["name"] for col in inspector.get_columns("sentiment_data")}

    with engine.begin() as conn:
        if "restaurant_name" not in existing:
            conn.execute(text(
                "ALTER TABLE sentiment_data ADD COLUMN restaurant_name VARCHAR(255)"
            ))
            conn.execute(text("""
                UPDATE sentiment_data sd
                SET restaurant_name = rm.name
                FROM restaurants_measured rm
                WHERE sd.restaurant_id = rm.id
                  AND sd.restaurant_name IS NULL
            """))
            conn.execute(text(
                "UPDATE sentiment_data SET restaurant_name = 'Unknown' "
                "WHERE restaurant_name IS NULL"
            ))
            conn.execute(text(
                "ALTER TABLE sentiment_data ALTER COLUMN restaurant_name SET NOT NULL"
            ))

        if "neutral_pct" not in existing:
            conn.execute(text(
                "ALTER TABLE sentiment_data ADD COLUMN neutral_pct FLOAT DEFAULT 0 NOT NULL"
            ))
            conn.execute(text("""
                UPDATE sentiment_data
                SET neutral_pct = GREATEST(0, 100 - positive_pct - negative_pct)
                WHERE neutral_pct = 0
            """))

        if "reviews" not in existing:
            conn.execute(text(
                "ALTER TABLE sentiment_data ADD COLUMN reviews JSONB"
            ))

        if "ai_insights" not in existing:
            conn.execute(text(
                "ALTER TABLE sentiment_data ADD COLUMN ai_insights JSONB"
            ))

        if inspector.has_table("restaurants_measured"):
            rest_cols = {col["name"] for col in inspector.get_columns("restaurants_measured")}
            if "sample_reviews" in rest_cols:
                conn.execute(text(
                    "ALTER TABLE restaurants_measured DROP COLUMN sample_reviews"
                ))
            if "review_ratings" in rest_cols:
                conn.execute(text(
                    "ALTER TABLE restaurants_measured DROP COLUMN review_ratings"
                ))
