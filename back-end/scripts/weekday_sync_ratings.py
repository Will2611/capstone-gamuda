"""
Weekday job — sync star ratings from restaurant-reviews_latest.csv.

Wrapper around src.jobs.sentiment_pipeline.sync_ratings (old command still works).

Run from back-end/:  python scripts/weekday_sync_ratings.py
"""
from src.jobs.sentiment_pipeline import sync_ratings


if __name__ == "__main__":
    sync_ratings()
    print("Run sentiment analysis (weekend script or combined pipeline) for text themes.")
