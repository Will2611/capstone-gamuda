from __future__ import annotations

import random
from typing import List, OrderedDict, TypedDict

from faker.providers import BaseProvider

from src.database.models.reviews import SENTIMENT_TYPE, SentimentModelValidation

# Canonical theme labels — match sentiment analyzer + dashboard
THEME_WAIT = "Wait Time"
THEME_TASTE = "Taste"
THEME_SERVICE = "Service"
THEME_OTHER = "Other"


class BaseReviewData(TypedDict):
    content: str
    theme: str


class ReviewData(TypedDict, total=False):
    content: str
    sentiment: SentimentModelValidation
    stars: int


class ReviewProvider(BaseProvider):
    positive_data: List[BaseReviewData] = [
        {"content": "The steak was cooked to perfection, very juicy.", "theme": THEME_TASTE},
        {"content": "Our waiter was incredibly attentive and friendly.", "theme": THEME_SERVICE},
        {"content": "Best tiramisu I've ever had, highly recommend.", "theme": THEME_TASTE},
        {"content": "Fresh ingredients and bold flavors in every dish.", "theme": THEME_TASTE},
        {"content": "Staff remembered our preferences from last visit.", "theme": THEME_SERVICE},
        {"content": "Portions were generous and beautifully plated.", "theme": THEME_TASTE},
        {"content": "Quick seating even on a busy Friday night.", "theme": THEME_WAIT},
        {"content": "The laksa had an authentic, rich broth.", "theme": THEME_TASTE},
        {"content": "Host was welcoming and the ambiance felt cozy.", "theme": THEME_OTHER},
        {"content": "Excellent value for the quality of food served.", "theme": THEME_TASTE},
    ]

    negative_data: List[BaseReviewData] = [
        {"content": "Had to wait 45 minutes for a table despite having a reservation.", "theme": THEME_WAIT},
        {"content": "The noise level made it hard to have a conversation.", "theme": THEME_OTHER},
        {"content": "Food arrived cold after a 20-minute wait.", "theme": THEME_WAIT},
        {"content": "Service was slow and our order was forgotten twice.", "theme": THEME_SERVICE},
        {"content": "The mains tasted bland and under-seasoned.", "theme": THEME_TASTE},
        {"content": "Overpriced for the portion sizes we received.", "theme": THEME_OTHER},
        {"content": "Staff seemed rushed and inattentive throughout.", "theme": THEME_SERVICE},
        {"content": "Waited over an hour before anyone took our order.", "theme": THEME_WAIT},
        {"content": "Dessert was disappointing and not worth the price.", "theme": THEME_TASTE},
        {"content": "Tables were cramped and the room felt overcrowded.", "theme": THEME_OTHER},
    ]

    neutral_data: List[BaseReviewData] = [
        {"content": "The food was okay, nothing special but edible.", "theme": THEME_TASTE},
        {"content": "Service was average, neither fast nor slow.", "theme": THEME_SERVICE},
        {"content": "Prices are standard for this area, no surprises.", "theme": THEME_OTHER},
        {"content": "The place was clean but the decor was a bit dated.", "theme": THEME_OTHER},
        {"content": "Decent meal overall, might return if in the area.", "theme": THEME_TASTE},
        {"content": "Parking was available but the lot filled up quickly.", "theme": THEME_OTHER},
    ]

    _dishes = (
        "steak", "pasta", "laksa", "satay", "ramen", "curry", "pizza", "sushi",
        "nasi lemak", "char kuey teow", "roast chicken", "fish and chips",
    )
    _positive_adjectives = (
        "excellent", "delicious", "amazing", "perfect", "fresh", "authentic",
        "memorable", "outstanding", "flavorful", "beautifully cooked",
    )
    _negative_adjectives = (
        "disappointing", "bland", "overcooked", "salty", "greasy", "cold",
        "underwhelming", "overpriced", "slow", "inconsistent",
    )

    _function_weights = OrderedDict([
        ("positive", 52),
        ("negative", 15),
        ("neutral", 5),
        ("mixed", 10),
        ("conflict", 18),
    ])

    def _composed_positive(self) -> BaseReviewData:
        dish = self.random_element(self._dishes)
        adj = self.random_element(self._positive_adjectives)
        templates = [
            f"The {dish} was {adj} and exceeded our expectations.",
            f"Loved the {dish} — {adj} and served piping hot.",
            f"Would come back just for the {dish}; truly {adj}.",
        ]
        return {"content": self.random_element(templates), "theme": THEME_TASTE}

    def _composed_negative(self) -> BaseReviewData:
        dish = self.random_element(self._dishes)
        adj = self.random_element(self._negative_adjectives)
        templates = [
            f"The {dish} was {adj} and not what we hoped for.",
            f"Expected better — the {dish} tasted {adj}.",
            f"Left disappointed; the {dish} was {adj} for the price.",
        ]
        theme = THEME_TASTE if self.random_int(0, 1) else self.random_element([THEME_WAIT, THEME_SERVICE])
        return {"content": self.random_element(templates), "theme": theme}

    def _pick_positive(self) -> BaseReviewData:
        if self.random_int(1, 100) <= 40:
            return self._composed_positive()
        return self.random_element(self.positive_data)

    def _pick_negative(self) -> BaseReviewData:
        if self.random_int(1, 100) <= 40:
            return self._composed_negative()
        return self.random_element(self.negative_data)

    def positive_review(self) -> ReviewData:
        result = self._pick_positive()
        return {
            "content": result["content"],
            "sentiment": SentimentModelValidation(
                positive=[result["theme"]],
                negative=[],
                neutral=[],
            ),
        }

    def negative_review(self) -> ReviewData:
        result = self._pick_negative()
        return {
            "content": result["content"],
            "sentiment": SentimentModelValidation(
                negative=[result["theme"]],
                positive=[],
                neutral=[],
            ),
        }

    def neutral_review(self) -> ReviewData:
        result = self.random_element(self.neutral_data)
        return {
            "content": result["content"],
            "sentiment": SentimentModelValidation(
                neutral=[result["theme"]],
                positive=[],
                negative=[],
            ),
        }

    def mixed_review(self) -> ReviewData:
        neg_result = self._pick_negative()
        pos_result = self._pick_positive()
        return {
            "content": f"{neg_result['content']} However, {pos_result['content']}",
            "sentiment": SentimentModelValidation(
                negative=[neg_result["theme"]],
                positive=[pos_result["theme"]],
                neutral=[],
            ),
        }

    def conflict_review(self) -> ReviewData:
        """High stars + negative text, or low stars + positive text — for Gemini testing."""
        if self.random_int(0, 1) == 0:
            text_row = self._pick_negative()
            stars = self.random_element([4, 5])
            return {
                "content": text_row["content"],
                "stars": stars,
                "sentiment": SentimentModelValidation(
                    negative=[text_row["theme"]],
                    positive=[],
                    neutral=[],
                ),
            }

        text_row = self._pick_positive()
        stars = self.random_element([1, 2])
        return {
            "content": text_row["content"],
            "stars": stars,
            "sentiment": SentimentModelValidation(
                positive=[text_row["theme"]],
                negative=[],
                neutral=[],
            ),
        }

    def any_review(self) -> tuple[SENTIMENT_TYPE, ReviewData]:
        selected_key = self.random_elements(
            elements=self._function_weights, length=1, use_weighting=True,
        )[0]

        if selected_key == "positive":
            return "Positive", self.positive_review()
        if selected_key == "negative":
            return "Negative", self.negative_review()
        if selected_key == "neutral":
            return "Neutral", self.neutral_review()
        if selected_key == "conflict":
            data = self.conflict_review()
            if data["sentiment"].negative:
                return "Negative", data
            return "Positive", data
        return "Mixed", self.mixed_review()


def stars_for_sentiment(sentiment: SENTIMENT_TYPE, override: int | None = None) -> int:
    """Align star ratings with sentiment unless an explicit override is set."""
    if override is not None:
        return override
    if sentiment == "Positive":
        return random.choice([4, 5])
    if sentiment == "Negative":
        return random.choice([1, 2])
    if sentiment == "Mixed":
        return random.choice([3, 4])
    return 3
