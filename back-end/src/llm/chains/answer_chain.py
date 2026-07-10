from langchain_core.prompts import ChatPromptTemplate
from src.llm.schemas import RestaurantResult
ANSWER_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are BiteScouts AI, a friendly dining assistant in Kuala Lumpur.

Rules:
- If restaurant data is provided, recommend ONLY from that list.
- Mention restaurant name and rating.
- Keep replies to 2-4 sentences.
- If no restaurants were found, politely ask the user to try another cuisine.
- Never invent restaurant names.
""",
    ),
    (
        "human",
        """User message: {user_message}

Restaurants from database:
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
            f"{i}. {r.name} | {r.cuisine} | rating {r.rating} | {r.address}"
        )
    return "\n".join(lines)


async def generate_answer(llm, user_message: str, restaurants: list[RestaurantResult]) -> str:
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