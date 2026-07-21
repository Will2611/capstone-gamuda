from langchain_core.prompts import ChatPromptTemplate
from src.llm.intent import DiningIntent

INTENT_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are a precise dining intent extraction assistant for a Kuala Lumpur restaurant app.
Your task is to populate the DiningIntent schema fields:
1. needs_restaurant_search: Set to true if the user asks for food, restaurants, recommendations, or places to eat. Also true when wants_more_alternatives is true. Set to false for greetings, goodbyes, or general questions that do not require finding restaurants.
2. wants_more_alternatives: Set to true if the user wants different or additional options beyond what was already suggested (e.g. "other suggestions", "show me more", "anything else?", "more options", "not these", "something different" when referring to prior restaurant recommendations). Set to false for a fresh/new search request.
3. cuisines: Identify the requested cuisines. Extract keywords from the list: [Japanese, Korean, Chinese, Western, Italian, Thai, Cafe, Dessert, Seafood, Malaysian, Indian]. Map informal terms if needed (e.g., "sushi" or "ramen" -> "Japanese"). If no cuisine is requested, leave this list empty. IMPORTANT: when wants_more_alternatives is true and the latest message does not name a new cuisine, inherit cuisines from the recent conversation context.
4. user_message_summary: A concise, one-sentence summary of the user's message.
5. max_distance_km: If the user mentions a distance constraint extract it as a float in km. Examples: "within 2km" -> 2.0, "within 500m" -> 0.5, "near me" or "close by" -> 3.0. If no distance is mentioned, set to null. When wants_more_alternatives is true, inherit from conversation context if previously stated.
6. price_level: If the user mentions budget/price: "cheap", "budget", "affordable" -> 1; "moderate", "mid-range" -> 2; "expensive", "upscale" -> 3; "fine dining", "luxury" -> 4. Set to null if not mentioned. When wants_more_alternatives is true, inherit from conversation context if previously stated.
7. dietary: Extract any dietary restrictions the user mentions. Valid values: [Halal, Vegetarian, Vegan, Gluten-free]. Leave as empty list if none stated. When wants_more_alternatives is true, inherit from conversation context if previously stated.

Example 1:
Input: "I want Japanese food tonight"
Output: needs_restaurant_search=true, wants_more_alternatives=false, cuisines=["Japanese"], user_message_summary="User wants Japanese food recommendations.", max_distance_km=null, price_level=null, dietary=[]

Example 2:
Input: "Hello, how are you?"
Output: needs_restaurant_search=false, wants_more_alternatives=false, cuisines=[], user_message_summary="User greeted the assistant.", max_distance_km=null, price_level=null, dietary=[]

Example 3:
Input: "Find me cheap halal food within 3km"
Output: needs_restaurant_search=true, wants_more_alternatives=false, cuisines=[], user_message_summary="User wants cheap halal food within 3km.", max_distance_km=3.0, price_level=1, dietary=["Halal"]

Example 4 (with conversation context showing prior Japanese search):
Latest message: "Other suggestions"
Output: needs_restaurant_search=true, wants_more_alternatives=true, cuisines=["Japanese"], user_message_summary="User wants more Japanese restaurant alternatives.", max_distance_km=null, price_level=null, dietary=[]
""",
    ),
    (
        "human",
        """Recent conversation (oldest to newest):
{conversation_context}

Latest user message: {user_message}
""",
    ),
])


def _format_conversation_context(messages: list[dict], max_turns: int = 6) -> str:
    """Format recent chat turns for intent inheritance."""
    recent = messages[-max_turns:] if messages else []
    if not recent:
        return "(no prior messages)"
    lines = []
    for m in recent:
        role = m.get("role", "user")
        content = (m.get("content") or "").strip()
        if not content:
            continue
        label = "User" if role == "user" else "Assistant"
        # Keep assistant turns short so intent focuses on constraints, not restaurant prose
        if role == "assistant" and len(content) > 200:
            content = content[:200] + "…"
        lines.append(f"{label}: {content}")
    return "\n".join(lines) if lines else "(no prior messages)"


async def extract_intent(
    llm,
    user_message: str,
    messages: list[dict] | None = None,
) -> DiningIntent:
    structured_llm = llm.with_structured_output(DiningIntent)
    chain = INTENT_PROMPT | structured_llm
    # Exclude the latest user message from context (passed separately)
    prior = (messages or [])[:-1] if messages else []
    return await chain.ainvoke({
        "user_message": user_message,
        "conversation_context": _format_conversation_context(prior),
    })
