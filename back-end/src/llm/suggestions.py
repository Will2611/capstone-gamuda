"""Rule-based follow-up suggestion chips for the chatbot UI."""

from src.llm.intent import DiningIntent
from src.llm.schemas import RestaurantResult

RANDOMIZER = "Surprise me!"

_ALT_CUISINES = [
    "Japanese",
    "Korean",
    "Thai",
    "Malaysian",
    "Italian",
    "Chinese",
    "Indian",
    "Western",
]


def build_suggestions(
    intent: DiningIntent | None,
    restaurants: list[RestaurantResult],
    *,
    needs_location: bool = False,
) -> list[str]:
    """Return up to 3 contextual chips plus a randomizer."""
    chips: list[str] = []

    if needs_location:
        chips = ["Restaurants near me", "What's good for dinner?"]
    elif intent is None:
        chips = ["Restaurants near me", "Halal options", "Budget eats"]
    elif intent.needs_restaurant_search and restaurants:
        if intent.cuisines:
            primary = intent.cuisines[0]
            alts = [c for c in _ALT_CUISINES if c.lower() not in {x.lower() for x in intent.cuisines}]
            if alts:
                chips.append(f"Try {alts[0]} instead")
            if intent.price_level is None or intent.price_level > 1:
                chips.append("Something cheaper")
            else:
                chips.append(f"More {primary} nearby")
            if intent.max_distance_km is None or intent.max_distance_km > 1:
                chips.append("Within 1 km")
            else:
                chips.append("Open late")
        else:
            chips.extend(["Japanese nearby", "Halal options", "Budget eats"])
        if intent.dietary:
            # Prefer a refine chip over duplicating dietary
            if "Open now" not in chips and len(chips) < 3:
                chips.append("Casual vibe")
        elif len(chips) < 3:
            chips.append("Vegetarian options")
    elif intent.needs_restaurant_search and not restaurants:
        chips = ["Broaden my search", "Different cuisine", "Further away"]
    else:
        chips = ["Restaurants near me", "What's good for dinner?", "Halal options"]

    # Dedupe, cap at 3 contextual, always end with randomizer
    seen: set[str] = set()
    unique: list[str] = []
    for chip in chips:
        key = chip.lower()
        if key == RANDOMIZER.lower() or key in seen:
            continue
        seen.add(key)
        unique.append(chip)
        if len(unique) >= 3:
            break

    unique.append(RANDOMIZER)
    return unique
