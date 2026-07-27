"""
Weekend job — hybrid VADER + LLM sentiment analysis on pending reviews.

Wrapper around src.jobs.sentiment_pipeline.run_sentiment_analysis
(old command still works).

Run from back-end/:  python scripts/weekend_sentiment_analysis.py
                     python scripts/weekend_sentiment_analysis.py --skip-llm
"""
import argparse
import asyncio

from src.jobs.sentiment_pipeline import run_sentiment_analysis


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Weekend sentiment analysis.")
    parser.add_argument(
        "--skip-llm",
        action="store_true",
        help="VADER/keywords only (no Gemini).",
    )
    parser.add_argument(
        "--with-llm",
        action="store_true",
        help="Enable LLM on conflicts (default if neither flag set).",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    # Preserve historical default: LLM on, unless --skip-llm
    use_llm = True
    if args.skip_llm:
        use_llm = False
    if args.with_llm:
        use_llm = True
    asyncio.run(run_sentiment_analysis(use_llm=use_llm))
