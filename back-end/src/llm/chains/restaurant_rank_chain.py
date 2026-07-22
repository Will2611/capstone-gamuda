"""LLM Agent 3 — rank Top 5 restaurants. Never invent restaurants."""
from __future__ import annotations

import json
import logging
from typing import Any

from langchain_core.prompts import ChatPromptTemplate

logger = logging.getLogger(__name__)

RANK_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """You rank restaurants for a first food date for two people in Malaysia.
ONLY use restaurants in the provided JSON list. Never invent names or IDs.
Return ONLY valid JSON with this shape:
{{
  "ranked_ids": ["uuid", "..."],
  "top_reason": "≤80 words why #1 fits both",
  "vibe": "Casual|Romantic|Cafe|Adventure|Fine dining"
}}
Include every provided restaurant id exactly once in ranked_ids.
""",
        ),
        (
            "human",
            """User A prefs: cuisine={cuisine_a}, dietary={dietary_a}, vibes={vibes_a}, personality={persona_a}
User B prefs: cuisine={cuisine_b}, dietary={dietary_b}, vibes={vibes_b}, personality={persona_b}
Meetup: {meetup}
Restaurants (JSON):
{restaurants_json}
""",
        ),
    ]
)


def _extract_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for c in content:
            if isinstance(c, dict) and "text" in c:
                parts.append(c["text"])
            else:
                parts.append(str(c))
        return "".join(parts)
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


async def rank_restaurants(
    llm,
    *,
    restaurants: list[dict],
    cuisine_a: list[str],
    cuisine_b: list[str],
    dietary_a: list[str],
    dietary_b: list[str],
    vibes_a: list[str],
    vibes_b: list[str],
    persona_a: list[str],
    persona_b: list[str],
    meetup: str,
) -> dict:
    if not restaurants:
        return {"ranked_ids": [], "top_reason": "No suitable restaurant found.", "vibe": "Casual"}

    valid_ids = [str(r["id"]) for r in restaurants]
    try:
        chain = RANK_PROMPT | llm
        response = await chain.ainvoke(
            {
                "cuisine_a": cuisine_a,
                "cuisine_b": cuisine_b,
                "dietary_a": dietary_a,
                "dietary_b": dietary_b,
                "vibes_a": vibes_a,
                "vibes_b": vibes_b,
                "persona_a": persona_a,
                "persona_b": persona_b,
                "meetup": meetup,
                "restaurants_json": json.dumps(restaurants, default=str),
            }
        )
        data = _parse_json(_extract_text(response.content))
        ranked = [rid for rid in data.get("ranked_ids", []) if rid in valid_ids]
        # Append any missing ids in original order
        for vid in valid_ids:
            if vid not in ranked:
                ranked.append(vid)
        return {
            "ranked_ids": ranked,
            "top_reason": str(data.get("top_reason", ""))[:500],
            "vibe": str(data.get("vibe", "Casual")),
        }
    except Exception as exc:
        logger.warning("Restaurant ranking LLM failed, using rating order: %s", exc)
        return {
            "ranked_ids": valid_ids,
            "top_reason": "Top pick by highest rating among restaurants near both of you.",
            "vibe": "Casual",
        }
