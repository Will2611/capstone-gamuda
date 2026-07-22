import asyncio
from src.llm.sentiment_analyzer import analyze_review

async def test():
    result = await analyze_review(
        "Had to wait 45 minutes for a table despite having a reservation.",
        5,
        use_llm=True,
    )
    print(result)

asyncio.run(test())