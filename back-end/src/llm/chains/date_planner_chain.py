"""LLM Agent 4 — personalized first-date ideas. Max ~250 words."""
from __future__ import annotations

import json
import logging
from typing import Any

from langchain_core.prompts import ChatPromptTemplate

logger = logging.getLogger(__name__)

PLANNER_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """Create concise first-date ideas for this restaurant and couple.
Keep the whole response under 250 words.
Return ONLY valid JSON:
{{
  "restaurant_name": "...",
  "summary": "...",
  "why_both": "...",
  "conversation_starters": ["...", "...", "..."],
  "ice_breakers": ["...", "...", "..."],
  "fun_food_challenge": "...",
  "nearby_dessert": null,
  "nearby_activity": null,
  "estimated_budget": "...",
  "suggested_meeting_time": "...",
  "expected_duration": "...",
  "vibe": "Casual|Romantic|Cafe|Adventure|Fine dining"
}}
Do not invent a different main restaurant. Optional nearby tips may be omitted (null).
""",
        ),
        (
            "human",
            """Restaurant: {restaurant_json}
User A: foods={foods_a}, personality={persona_a}, dietary={dietary_a}
User B: foods={foods_b}, personality={persona_b}, dietary={dietary_b}
Meetup: {meetup}
Vibe hint: {vibe}
""",
        ),
    ]
)


def _extract_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(
            c["text"] if isinstance(c, dict) and "text" in c else str(c) for c in content
        )
    return str(content)


def _parse_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        text = text[start : end + 1]
    return json.loads(text)


def stub_date_ideas(restaurant: dict, meetup: str, vibe: str = "Casual") -> dict:
    name = restaurant.get("name", "the restaurant")
    return {
        "restaurant_name": name,
        "summary": restaurant.get("summary") or f"A well-rated spot for a first food date at {name}.",
        "why_both": "It sits within a comfortable distance for both of you and matches shared food tastes.",
        "conversation_starters": [
            "What cuisine would you travel for?",
            "Best meal you've had this year?",
            "Sweet or savory kind of person?",
        ],
        "ice_breakers": [
            "Rate this place's vibe 1–10 before we order.",
            "If this dish were a movie genre, what would it be?",
            "One food rule you always break?",
        ],
        "fun_food_challenge": "Each pick one dish the other has never tried — share bites.",
        "nearby_dessert": None,
        "nearby_activity": None,
        "estimated_budget": "RM 40–80 per person" if not restaurant.get("price_level") else f"Price level {restaurant.get('price_level')}/4",
        "suggested_meeting_time": meetup,
        "expected_duration": "90–120 minutes",
        "vibe": vibe,
    }


async def generate_date_ideas(
    llm,
    *,
    restaurant: dict,
    foods_a: list[str],
    foods_b: list[str],
    persona_a: list[str],
    persona_b: list[str],
    dietary_a: list[str],
    dietary_b: list[str],
    meetup: str,
    vibe: str = "Casual",
    use_llm: bool = True,
) -> dict:
    if not use_llm or llm is None:
        return stub_date_ideas(restaurant, meetup, vibe)

    try:
        chain = PLANNER_PROMPT | llm
        response = await chain.ainvoke(
            {
                "restaurant_json": json.dumps(restaurant, default=str),
                "foods_a": foods_a,
                "foods_b": foods_b,
                "persona_a": persona_a,
                "persona_b": persona_b,
                "dietary_a": dietary_a,
                "dietary_b": dietary_b,
                "meetup": meetup,
                "vibe": vibe,
            }
        )
        data = _parse_json(_extract_text(response.content))
        data["restaurant_name"] = restaurant.get("name") or data.get("restaurant_name", "")
        return data
    except Exception as exc:
        logger.warning("Date planner LLM failed, using stub: %s", exc)
        return stub_date_ideas(restaurant, meetup, vibe)
