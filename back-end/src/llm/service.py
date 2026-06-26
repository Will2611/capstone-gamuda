from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_ollama import ChatOllama
from src.llm.tools.restaurant_tool import make_restaurant_search_tool
from src.llm.chains.intent_chain import extract_intent
from src.llm.chains.answer_chain import generate_answer

from . import config

SYSTEM_PROMPT = """You are BiteScouts AI, a friendly dining discovery assistant in Kuala Lumpur.
Help users choose restaurants based on cuisine, mood, budget, dietary needs (halal, vegetarian), and distance.
Keep replies concise (2-4 sentences). Suggest specific restaurant types or areas when possible."""


def get_llm():
    if config.LLM_PROVIDER == "gemini":
        if not config.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is required when LLM_PROVIDER=gemini")
        return ChatGoogleGenerativeAI(
            model=config.GEMINI_MODEL,
            google_api_key=config.GEMINI_API_KEY,
        )
    return ChatOllama(
        model=config.OLLAMA_MODEL,
        base_url=config.OLLAMA_BASE_URL,
    )


def _to_langchain_messages(messages: list[dict]) -> list:
    lc_messages = [SystemMessage(content=SYSTEM_PROMPT)]
    for msg in messages:
        if msg["role"] == "assistant":
            lc_messages.append(AIMessage(content=msg["content"]))
        else:
            lc_messages.append(HumanMessage(content=msg["content"]))
    return lc_messages


async def chat(messages: list[dict]) -> str:
    trimmed = messages[-config.MAX_HISTORY_TURNS :]
    llm = get_llm()
    response = await llm.ainvoke(_to_langchain_messages(trimmed))
    content = response.content
    if isinstance(content, str):
        return content
    return str(content)

async def get_top_restaurants(db, cuisines: list[str], limit: int = 3) -> list[dict]:
    if not cuisines:
        return[]
    
    tool = make_restaurant_search_tool(db)
    all_results: list[dict] = []

    for cuisine in cuisines:
        result = tool.invoke({"cuisine": cuisine, "limit": limit})
        all_results.extend(result)

    by_id = {r["id"]: r for r in all_results}

    sorted_results = sorted(by_id.values(), key=lambda r: r["rating"], reverse=True)
    return sorted_results[:limit]

async def chat_with_restaurant_search(messages: list[dict],db) -> tuple[str, list[dict]]:
    llm = get_llm()

    # 1. Get latest user message
    latest_user = next(
        (m["content"] for m in reversed(messages) if m["role"] == "user"),
        "",
    )
    if not latest_user:
        return "i didn't catch that. What kind of food are you looking for?", []
    
    # 2. Chain 1 — extract intent
    intent = await extract_intent(llm, latest_user)

     # 3. DB search (only when needed)
    restaurants: list[dict] = []
    if intent.needs_restaurant_search and intent.cuisines:
        restaurants = await get_top_restaurants(db, intent.cuisines, limit=3)
    
    # 4. Chain 2 — grounded reply
    reply = await generate_answer(llm, latest_user, restaurants)
    return reply, restaurants   
