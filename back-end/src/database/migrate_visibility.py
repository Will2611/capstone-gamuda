"""
Apply visibility schema changes to an existing database.

create_all() only creates missing tables — it does not add new columns.
Run this on startup so sentiment_data picks up restaurant_name, neutral_pct, reviews.
"""
from sqlalchemy import inspect, text, Inspector
from sqlalchemy.engine import Engine, Connection


def ensure_visibility_schema(engine: Engine) -> None:
    with engine.begin() as conn:
        inspector = inspect(conn)

        if inspector.has_table("sentiment_data"):
            existing_schema = {col["name"] for col in inspector.get_columns("sentiment_data")}
            sentiment_schema_update(conn, existing=existing_schema)

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
        if inspector.has_table('restaurants'):
            restaurants_update(conn=conn, inspector=inspector)

        if inspector.has_table('users'):
            users_update(conn=conn, inspector=inspector)
        # Foot traffic is hourly-only; drop legacy daily table if present
        if inspector.has_table("foot_traffic_daily"):
            conn.execute(text("DROP TABLE IF EXISTS foot_traffic_daily CASCADE"))
        drop_tables(conn=conn,inspector=inspector,table_names=['shops','restaurants_measured'])

        if inspector.has_table("promotions"):
            prom_cols_info = {col["name"]: str(col["type"]).lower() for col in inspector.get_columns("promotions")}
            prom_cols = set(prom_cols_info.keys())
            if "id" in prom_cols_info and "uuid" not in prom_cols_info["id"]:
                conn.execute(text("""
                    ALTER TABLE promotions 
                    ALTER COLUMN id TYPE UUID 
                    USING (
                        CASE 
                            WHEN id IS NULL THEN gen_random_uuid()
                            WHEN id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN id::uuid 
                            ELSE gen_random_uuid() 
                        END
                    )
                """))
            if "restaurant_id" not in prom_cols:
                conn.execute(text("ALTER TABLE promotions ADD COLUMN restaurant_id UUID REFERENCES restaurants(id)"))
            if "created_at" not in prom_cols:
                conn.execute(text("ALTER TABLE promotions ADD COLUMN created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()"))
            if "updated_at" not in prom_cols:
                conn.execute(text("ALTER TABLE promotions ADD COLUMN updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()"))

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

def restaurants_update(conn:Connection, inspector: Inspector):
    existing_indexes = inspector.get_indexes('restaurants')
    existing_index_names = set([index['name'] for index in existing_indexes])
    if 'ix_restaurants_geohash' in existing_index_names:
        conn.execute(text("DROP INDEX IF EXISTS ix_restaurants_geohash"))
    return
def users_update(conn:Connection, inspector: Inspector):
    existing_cols = inspector.get_columns('users')
    existing_index_names = set([col['name'] for col in existing_cols])
    if 'user_notifications' not in existing_index_names:
        conn.execute(text("ALTER TABLE users ADD COLUMN user_notifications JSON"))
    return

def drop_tables(conn:Connection, inspector:Inspector, table_names:list[str]):
    for name in table_names:
        if inspector.has_table(name):
            conn.execute(text(f'DROP TABLE {name}'))
    return