"""
Apply visibility schema changes to an existing database.

create_all() only creates missing tables — it does not add new columns.
Run this on startup so sentiment_data picks up restaurant_name, neutral_pct, reviews.
"""
from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine, Connection


def ensure_visibility_schema(engine: Engine) -> None:
    inspector = inspect(engine)

    with engine.begin() as conn:
        if inspector.has_table("sentiment_data"):
            existing_schema = {col["name"] for col in inspector.get_columns("sentiment_data")}
            sentiment_schema_update(conn,existing=existing_schema)

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

def sentiment_schema_update (conn:Connection, existing:set[str]):
    if "neutral_pct" not in existing:
        conn.execute(text(
           "ALTER TABLE sentiment_data ADD COLUMN neutral_pct FLOAT DEFAULT 0 NOT NULL"
        ))
        conn.execute(text("""
            UPDATE sentiment_data
           SET neutral_pct = GREATEST(0, 100 - positive_pct - negative_pct)
           WHERE neutral_pct = 0
       """))
    if "mixed_pct" not in existing:
        conn.execute(text(
           "ALTER TABLE sentiment_data ADD COLUMN mixed_pct FLOAT DEFAULT 0 NOT NULL"
        ))
        conn.execute(text("""
            UPDATE sentiment_data
           SET mixed_pct = GREATEST(0, 100 - positive_pct - negative_pct)
           WHERE mixed_pct = 0
       """))
    if "reviews" not in existing:
        conn.execute(text(
            "ALTER TABLE sentiment_data ADD COLUMN reviews JSONB"
        ))
