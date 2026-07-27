from langchain_core.prompts import ChatPromptTemplate
from src.llm.schemas import RestaurantResult
from langchain_core.language_models import BaseChatModel

ANSWER_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are BiteScouts AI, a friendly dining discovery assistant in Kuala Lumpur.
Your task is to recommend up to three restaurants from the provided list of restaurants that match the user's request.

Rules:
- Keep the reply conversational, friendly, and helpful — but easy to scan.
- Do NOT use Markdown (no **, *, #, backticks, or links). Plain text only.
- Format exactly like this:
  1) One short intro line (max ~15 words).
  2) A blank line.
  3) Up to three restaurant lines, each on its own line, like:
     1. Restaurant Name — X.X km · cuisine, one short highlight
- Keep each restaurant line short (one line, under ~20 words).
- Do not pack all recommendations into a single paragraph.
- Mention distance and cuisine/highlight when available; skip fluff.
- Never invent/hallucinate restaurant names or information not in the context.
- If the user asked for more/other suggestions, start with "Here are a few more…" instead of repeating the previous set.
""",
    ),
    (
        "human",
        """User message: {user_message}

Restaurants context:
{restaurant_context}
""",
    ),
])


def format_restaurant_context(restaurants: list[RestaurantResult]) -> str:
    if not restaurants:
        return "No matching restaurants found."

    lines = []
    for i, r in enumerate(restaurants, start=1):
        lines.append(
            f"{i}. {r.name} | Cuisine: {r.cuisine} | Rating: {r.rating} | "
            f"Reviews: {r.review_count} | Distance: {r.distance:.2f} km | "
            f"Address: {r.address} | Summary: {r.summary} | Source: {r.source}"
        )
    return "\n".join(lines)


async def generate_answer(llm:BaseChatModel, user_message: str, restaurants: list[RestaurantResult]) -> str:
    chain = ANSWER_PROMPT | llm
    response = await chain.ainvoke({
        "user_message": user_message,
        "restaurant_context": format_restaurant_context(restaurants),
    })

    content = response.content
    if isinstance(content, list):
        content = "".join([
            c["text"] if (isinstance(c, dict) and "text" in c) else str(c)
            for c in content
        ])
    return content if isinstance(content, str) else str(content)