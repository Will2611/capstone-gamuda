"""
Gemini root-cause insights for strongly negative reviews (Scenario 2).

Token limits:
- VADER flags reviews with compound <= -0.3 only
- Max 25 review texts sent per restaurant per run
- Max 2 structured suggestions returned
- Results cached and stored in sentiment_data.ai_insights (no live API on dashboard load)
"""

from __future__ import annotations

import hashlib
import json
import os
from datetime import date
from pathlib import Path

from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

from src.llm import config
from src.llm.gemini_insights_schema import GeminiInsightsResult
from src.llm.vader_sentiment import clean_review_text

VADER_FLAG_THRESHOLD = float(os.getenv("GEMINI_VADER_THRESHOLD", "-0.3"))
MAX_REVIEWS_IN_PROMPT = int(os.getenv("GEMINI_MAX_REVIEWS", "25"))
MAX_AI_SUGGESTIONS = int(os.getenv("GEMINI_MAX_SUGGESTIONS", "2"))
MAX_REVIEW_CHARS = int(os.getenv("GEMINI_MAX_REVIEW_CHARS", "120"))

_CACHE_PATH = Path(__file__).resolve().parents[2] / "data" / "gemini_insights_cache.json"

INSIGHTS_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are a restaurant QA analyst. From negative reviews, return at most 2 actionable items.
Categories: Wait Time, Taste, Service, or Other.
Keep issue titles under 10 words. Keep each recommendation to one sentence.""",
    ),
    (
        "human",
        """Restaurant: {restaurant_name}
Highly negative reviews (VADER-filtered, max {review_count} shown):
{review_list}

Return structured suggestions.""",
    ),
])


def _load_cache() -> dict[str, dict]:
    if not _CACHE_PATH.exists():
        return {}
    try:
        return json.loads(_CACHE_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


def _save_cache(cache: dict[str, dict]) -> None:
    _CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    _CACHE_PATH.write_text(json.dumps(cache, indent=2), encoding="utf-8")


def _compound_score(text: str) -> float:
    from src.llm.vader_sentiment import _ensure_vader

    cleaned = clean_review_text(text)
    if not cleaned:
        return 0.0
    return _ensure_vader().polarity_scores(cleaned)["compound"]


def flag_reviews_for_gemini(analyzed_reviews: list[dict]) -> list[dict]:
    """Return reviews with strongly negative VADER compound scores."""
    flagged: list[dict] = []
    for review in analyzed_reviews:
        text = (review.get("text") or "").strip()
        if not text:
            continue
        compound = _compound_score(text)
        if compound <= VADER_FLAG_THRESHOLD:
            flagged.append({
                "text": text,
                "rating": review.get("rating"),
                "compound": compound,
                "theme": review.get("theme"),
            })
    flagged.sort(key=lambda r: r["compound"])
    return flagged[:MAX_REVIEWS_IN_PROMPT]


def _cache_key(restaurant_name: str, flagged: list[dict]) -> str:
    payload = "|".join(
        f"{r['rating']}:{clean_review_text(r['text']).lower()[:MAX_REVIEW_CHARS]}"
        for r in flagged
    )
    raw = f"{restaurant_name}:{payload}"
    return hashlib.sha256(raw.encode()).hexdigest()


def _format_review_lines(flagged: list[dict]) -> str:
    lines: list[str] = []
    for item in flagged:
        text = clean_review_text(item["text"])[:MAX_REVIEW_CHARS]
        lines.append(f"- [{item['rating']}★] {text}")
    return "\n".join(lines)


async def generate_gemini_insights(
    restaurant_name: str,
    analyzed_reviews: list[dict],
) -> dict | None:
    """
    Run Gemini on VADER-flagged reviews. Returns ai_insights dict or None if skipped.
    """
    if not config.GEMINI_API_KEY:
        return None

    flagged = flag_reviews_for_gemini(analyzed_reviews)
    if not flagged:
        return {
            "generated_at": date.today().isoformat(),
            "flagged_count": 0,
            "reviews_sent": 0,
            "source": "gemini",
            "suggestions": [],
            "skipped": "no_strongly_negative_reviews",
        }

    key = _cache_key(restaurant_name, flagged)
    cache = _load_cache()
    if key in cache:
        cached = cache[key]
        cached["from_cache"] = True
        return cached

    llm = ChatGoogleGenerativeAI(
        model=config.GEMINI_MODEL,
        google_api_key=config.GEMINI_API_KEY,
        temperature=0.2,
    )
    structured_llm = llm.with_structured_output(GeminiInsightsResult)
    chain = INSIGHTS_PROMPT | structured_llm

    try:
        result: GeminiInsightsResult = await chain.ainvoke({
            "restaurant_name": restaurant_name,
            "review_count": len(flagged),
            "review_list": _format_review_lines(flagged),
        })
    except Exception as exc:
        return {
            "generated_at": date.today().isoformat(),
            "flagged_count": len(flagged),
            "reviews_sent": len(flagged),
            "source": "gemini",
            "suggestions": [],
            "error": str(exc),
        }

    suggestions = [
        {
            "issue": item.issue,
            "impact": item.impact,
            "recommendation": item.recommendation,
            "source": "ai",
        }
        for item in result.suggestions[:MAX_AI_SUGGESTIONS]
    ]

    payload = {
        "generated_at": date.today().isoformat(),
        "flagged_count": len(flagged),
        "reviews_sent": len(flagged),
        "source": "gemini",
        "suggestions": suggestions,
        "from_cache": False,
    }
    cache[key] = payload
    _save_cache(cache)
    return payload
