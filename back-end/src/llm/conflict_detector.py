"""Rule-based sentiment signals — no API calls."""

from collections import defaultdict

POSITIVE_KEYWORDS = [
    "friendly", "welcoming", "attentive", "beautiful", "authentic", "loved",
    "excellent", "great", "amazing", "delicious", "quickly", "piping hot",
    "explained", "memorable", "value", "diverse", "polished", "professional",
    "creative", "refreshing", "unbeatable", "charming", "cozy", "lively",
    "balanced", "curated", "romantic", "exquisite",
]

NEGATIVE_KEYWORDS = [
    "bland", "slow", "wait", "waited", "delay", "spoiled", "rude",
    "disappointing", "inattentive", "frustrating", "inconsistent", "basic",
    "average", "loud", "crowded", "rushed", "small", "price", "hassle",
    "didn't live up", "did not live up", "longer than", "too long",
    "mistake", "wrong", "poor", "bad", "terrible", "awful",
]

THEME_KEYWORDS: dict[str, list[str]] = {
    "Wait Time": ["wait", "waited", "delay", "slow", "longer", "long", "crowded", "rushed"],
    "Taste": ["taste", "bland", "flavor", "portion", "dessert", "authentic", "food", "mains"],
    "Service": ["service", "staff", "attentive", "rude", "reservation", "inattentive"],
}


def sentiment_from_rating(rating: int) -> str:
    if rating >= 4:
        return "Positive"
    if rating <= 2:
        return "Negative"
    return "Neutral"


def sentiment_from_text(text: str) -> str:
    lower = text.lower()
    pos = sum(1 for kw in POSITIVE_KEYWORDS if kw in lower)
    neg = sum(1 for kw in NEGATIVE_KEYWORDS if kw in lower)
    if neg > pos:
        return "Negative"
    if pos > neg:
        return "Positive"
    return "Neutral"


def theme_from_text(text: str) -> str:
    lower = text.lower()
    scores: dict[str, int] = defaultdict(int)
    for theme, keywords in THEME_KEYWORDS.items():
        for kw in keywords:
            if kw in lower:
                scores[theme] += 1
    # If scores empty
    if not scores:
        return "Other"
    return max(scores, key=scores.get) # type: ignore[arg-type]


def has_sentiment_conflict(rating: int, text: str) -> bool:
    """True when star rating and review text imply different sentiment."""
    return sentiment_from_rating(rating) != sentiment_from_text(text)
