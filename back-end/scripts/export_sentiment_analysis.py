"""
Export hybrid VADER + Gemini conflict analysis to CSV.

Flow:
1. Load reviews per restaurant from the DB
2. VADER on every review (local)
3. Gemini abatch on conflicts only (temperature=0 via get_llm)
4. Write CSV with restaurant_name + analysis columns

Run from back-end/:
  python scripts/export_sentiment_analysis.py

Optional env:
  EXPORT_MAX_CONCURRENCY=3   parallel Gemini calls (default 3)
  EXPORT_CONFLICTS_ONLY=true write only conflict rows (default false)
  EXPORT_OUTPUT=path/to.csv  output path override
"""
from __future__ import annotations

import asyncio
import csv
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.database.connection import SessionLocal
from src.database.models.restaurants import RestaurantModel
from src.database.sentiment_helpers import load_reviews_from_db
from src.llm.sentiment_analyzer import analyze_reviews_batch

CSV_COLUMNS = [
    "restaurant_name",
    "text",
    "rating",
    "sentiment",
    "theme",
    "conflict",
    "source",
    "analyzed",
]

DEFAULT_OUTPUT = (
    Path(__file__).resolve().parents[1] / "sentiment_analysis_results.csv"
)


async def run_export() -> None:
    max_concurrency = int(os.getenv("EXPORT_MAX_CONCURRENCY", "3"))
    conflicts_only = os.getenv("EXPORT_CONFLICTS_ONLY", "").lower() in (
        "1", "true", "yes",
    )
    output = Path(os.getenv("EXPORT_OUTPUT", str(DEFAULT_OUTPUT)))

    db = SessionLocal()
    rows: list[dict] = []
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
        restaurants = (
            db.query(RestaurantModel)
            .order_by(RestaurantModel.name)
            .all()
        )
        print(f"Exporting sentiment analysis for {len(restaurants)} restaurants...")
        print(f"  LLM max_concurrency={max_concurrency} (abatch on conflicts)")
        print(f"  conflicts_only={conflicts_only}")

        for i, rest in enumerate(restaurants, start=1):
            pending = load_reviews_from_db(db, rest.id)
            if not pending:
                print(f"  [{i}/{len(restaurants)}] {rest.name}: no reviews, skip")
                continue

            for item in pending:
                item["restaurant_name"] = rest.name

            analyzed, stats = await analyze_reviews_batch(
                pending,
                use_llm=True,
                max_concurrency=max_concurrency,
            )

            for result in analyzed:
                row = {
                    "restaurant_name": result.get("restaurant_name") or rest.name,
                    "text": result.get("text"),
                    "rating": result.get("rating"),
                    "sentiment": result.get("sentiment"),
                    "theme": result.get("theme"),
                    "conflict": result.get("conflict"),
                    "source": result.get("source"),
                    "analyzed": result.get("analyzed"),
                }
                if conflicts_only and not row["conflict"]:
                    continue
                rows.append(row)

            total_stats["restaurants"] += 1
            total_stats["reviews"] += stats["total"]
            for key in ("vader", "rating_only", "conflicts", "llm", "llm_errors"):
                total_stats[key] += stats.get(key, 0)

            print(
                f"  [{i}/{len(restaurants)}] {rest.name}: "
                f"{stats['total']} reviews, "
                f"{stats.get('conflicts', 0)} conflicts, "
                f"{stats.get('llm', 0)} llm"
            )

    finally:
        db.close()

    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)

    print()
    print(f"Wrote {len(rows)} rows to {output}")
    print("Summary:")
    print(f"  Restaurants:  {total_stats['restaurants']}")
    print(f"  Reviews:      {total_stats['reviews']}")
    print(f"  VADER:        {total_stats['vader']}")
    print(f"  Conflicts:    {total_stats['conflicts']}")
    print(f"  LLM resolved: {total_stats['llm']}")
    if total_stats["llm_errors"]:
        print(f"  LLM errors:   {total_stats['llm_errors']}")


if __name__ == "__main__":
    asyncio.run(run_export())
