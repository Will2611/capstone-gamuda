import asyncio
from src.llm.service import get_llm
from src.llm.chains.intent_chain import extract_intent

async def test():
    llm = get_llm()
    intent = await extract_intent(llm, "I want Japanese food tonight")
    print(intent)

asyncio.run(test())