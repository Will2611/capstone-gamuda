"""VADER lexicon-based sentiment — no LLM required."""

from __future__ import annotations

import re

import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer

from src.llm.conflict_detector import sentiment_from_rating, sentiment_from_text, theme_from_text

_analyzer: SentimentIntensityAnalyzer | None = None


def _ensure_vader() -> SentimentIntensityAnalyzer:
    global _analyzer
    if _analyzer is not None:
        return _analyzer
    try:
        nltk.data.find("sentiment/vader_lexicon.zip")
    except LookupError:
        nltk.download("vader_lexicon", quiet=True)
    _analyzer = SentimentIntensityAnalyzer()
    return _analyzer


def clean_review_text(text: str) -> str:
    """Remove star glyphs and empty parens so VADER reads the complaint/praise."""
    cleaned = re.sub(r"[⭐★☆]+", "", text)
    cleaned = re.sub(r"\(\s*\)", "", cleaned)
    return cleaned.strip()


def sentiment_from_vader(text: str) -> str:
    analyzer = _ensure_vader()
    scores = analyzer.polarity_scores(clean_review_text(text))
    compound = scores["compound"]
    if compound >= 0.05:
        return "Positive"
    if compound <= -0.05:
        return "Negative"
    return "Neutral"


def analyze_review_text(text: str, rating: int) -> dict:
    """
    Classify one review using VADER on text + keyword themes.
    Text sentiment always drives the label when review text exists.
    """
    cleaned = clean_review_text(text)
    if not cleaned:
        return {
            "text": text,
            "rating": rating,
            "sentiment": sentiment_from_rating(rating),
            "theme": "Other",
            "analyzed": True,
            "source": "rating_only",
            "conflict": False,
        }

    vader_sentiment = sentiment_from_vader(text)
    keyword_sentiment = sentiment_from_text(text)
    if vader_sentiment == "Neutral" and keyword_sentiment != "Neutral":
        vader_sentiment = keyword_sentiment

    rating_sentiment = sentiment_from_rating(rating)
    theme = theme_from_text(text)

    return {
        "text": text,
        "rating": rating,
        "sentiment": vader_sentiment,
        "theme": theme,
        "analyzed": True,
        "source": "vader",
        "conflict": vader_sentiment != rating_sentiment,
    }
