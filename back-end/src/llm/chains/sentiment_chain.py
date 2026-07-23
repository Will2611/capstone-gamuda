from langchain_core.prompts import ChatPromptTemplate

from src.llm.review_sentiment import ReviewSentimentResult

SENTIMENT_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """You analyze restaurant reviews with conflicting rating vs text signals.

The star rating and review text may disagree (e.g. 5 stars but text complains).
Decide the TRUE sentiment based primarily on the review TEXT meaning.

Rules:
- sentiment: Positive, Negative, or Neutral
- theme: Wait Time, Taste, Service, or Other
- If text is clearly a complaint, prefer Negative even when rating is high
- If text is clearly praise, prefer Positive even when rating is low
""",
    ),
    (
        "human",
        """Review text: {text}
Star rating: {rating}/5
Rating-implied sentiment: {rating_sentiment}
Text-implied sentiment: {text_sentiment}

Return structured sentiment and theme.""",
    ),
])


def _conflict_chain(llm):
    structured_llm = llm.with_structured_output(ReviewSentimentResult)
    return SENTIMENT_PROMPT | structured_llm


async def classify_conflict_with_llm(
    llm,
    text: str,
    rating: int,
    rating_sentiment: str,
    text_sentiment: str,
) -> ReviewSentimentResult:
    chain = _conflict_chain(llm)
    return await chain.ainvoke({
        "text": text,
        "rating": rating,
        "rating_sentiment": rating_sentiment,
        "text_sentiment": text_sentiment,
    })


async def classify_conflicts_abatch(
    llm,
    inputs: list[dict],
    *,
    max_concurrency: int = 3,
) -> list[ReviewSentimentResult | BaseException]:
    """Resolve many rating/text conflicts in parallel via LangChain abatch.

    Each input dict must include: text, rating, rating_sentiment, text_sentiment.
    Returns results aligned with inputs; failed items are Exception instances.
    """
    if not inputs:
        return []
    chain = _conflict_chain(llm)
    return await chain.abatch(
        inputs,
        config={"max_concurrency": max_concurrency},
        return_exceptions=True,
    )
 