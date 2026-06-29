from langchain_core.prompts import ChatPromptTemplate
from src.llm.intent import DiningIntent

INTENT_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """You extract dining intent from user messages for a Kuala Lumpur restaurant app.

Rules:
- Set needs_restaurant_search=true when the user asks for food, restaurants, or recommendations.
- Set needs_restaurant_search=false for greetings or general chat.
- cuisines should be simple keywords: Japanese, Malaysian, Italian, Chinese, Indian, Thai, Korean, Western, Fine dining.
- Map informal words: sushi/ramen -> Japanese, mamak/nasi lemak -> Malaysian, pizza/pasta -> Italian.
- If user mentions multiple cuisines, include all of them.
- user_message_summary: one short sentence of what they want.
""",
    ),
    ("human", "{user_message}"),
])


async def extract_intent(llm, user_message: str) -> DiningIntent:
    structured_llm = llm.with_structured_output(DiningIntent)
    chain = INTENT_PROMPT | structured_llm
    return await chain.ainvoke({"user_message": user_message})