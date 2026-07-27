"""
Combined ratings + sentiment pipeline (demo / cloud entry).

Safe order: sync ratings → analyze sentiment (charts stay filled).

Run from back-end/:
  python scripts/run_sentiment_pipeline.py
  python scripts/run_sentiment_pipeline.py --with-llm
  python -m src.jobs.sentiment_pipeline
"""
import argparse

from src.jobs.sentiment_pipeline import run_pipeline


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Combined weekday ratings + weekend sentiment pipeline.",
    )
    parser.add_argument(
        "--with-llm",
        action="store_true",
        help="Enable Gemini on rating/text conflicts (default: off for stable demo).",
    )
    parser.add_argument(
        "--ratings-only",
        action="store_true",
        help="Only sync ratings.",
    )
    parser.add_argument(
        "--sentiment-only",
        action="store_true",
        help="Only run sentiment analysis.",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    run_pipeline(
        skip_llm=not args.with_llm,
        ratings_only=args.ratings_only,
        sentiment_only=args.sentiment_only,
    )
