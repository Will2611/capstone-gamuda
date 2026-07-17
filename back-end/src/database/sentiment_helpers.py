"""Shared CSV loading and sentiment_data aggregation helpers."""

import csv
from collections import defaultdict
from pathlib import Path

REVIEWS_CSV_PATH = Path(__file__).resolve().parents[1] / "seed" / "restaurant-reviews_latest.csv"


def load_reviews_by_restaurant(csv_path: Path | None = None) -> dict[str, list[dict]]:
    path = csv_path or REVIEWS_CSV_PATH
    grouped: dict[str, list[dict]] = defaultdict(list)
    if not path.exists():
        return grouped

    with path.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row["Restaurant"].strip()
            grouped[name].append({
                "text": row["Sample Reviews"].strip(),
                "rating": int(row["Rating_Value"]),
            })
    return grouped


def build_rating_only_reviews(reviews: list[dict]) -> list[dict]:
    """Weekday snapshot: ratings stored, text analysis pending."""
    return [
        {
            "text": r["text"],
            "rating": r["rating"],
            "sentiment": None,
            "theme": None,
            "analyzed": False,
            "source": "rating_only",
            "conflict": False,
        }
        for r in reviews
    ]


def compute_sentiment_pcts(reviews: list[dict]) -> tuple[float, float, float]:
    labeled = [r for r in reviews if r.get("sentiment")]
    total = len(labeled)
    if total == 0:
        return 0.0, 0.0, 0.0

    positive = sum(1 for r in labeled if r["sentiment"] == "Positive")
    negative = sum(1 for r in labeled if r["sentiment"] == "Negative")
    neutral = sum(1 for r in labeled if r["sentiment"] == "Neutral")

    return (
        round(positive / total * 100, 1),
        round(negative / total * 100, 1),
        round(neutral / total * 100, 1),
    )


def compute_avg_rating(reviews: list[dict]) -> float:
    if not reviews:
        return 0.0
    return round(sum(r["rating"] for r in reviews) / len(reviews), 1)


def compute_complaint_theme_counts(reviews: list[dict]) -> list[tuple[str, int]]:
    counts: dict[str, int] = defaultdict(int)
    for review in reviews:
        sentiment = review.get("sentiment")
        theme = review.get("theme")
        if sentiment in ("Negative", "Neutral") and theme:
            counts[theme] += 1
    return sorted(counts.items(), key=lambda item: item[1], reverse=True)


def replace_complaint_themes(db, sentiment_row, reviews: list[dict]) -> None:
    from src.database.models.visibility import ComplaintThemeModel

    db.query(ComplaintThemeModel).filter(
        ComplaintThemeModel.sentiment_id == sentiment_row.id,
    ).delete(synchronize_session=False)

    theme_counts = compute_complaint_theme_counts(reviews)
    for theme, count in theme_counts[:5]:
        db.add(ComplaintThemeModel(
            sentiment_id=sentiment_row.id,
            theme=theme,
            count=count,
        ))
