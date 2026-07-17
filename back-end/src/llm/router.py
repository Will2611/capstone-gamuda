from fastapi import APIRouter, HTTPException

from . import service
from .schemas import ChatRequest, ChatResponse
from src.database.connection import db_dependency

router = APIRouter(prefix="/llm", tags=["llm"])

# #default chat endpoint   
# @router.post("/chat", response_model=ChatResponse)
# async def chat_endpoint(body: ChatRequest):
#     if not body.messages:
#         raise HTTPException(status_code=400, detail="messages required")

#     for turn in body.messages:
#         if turn.role not in ("user", "assistant"):
#             raise HTTPException(
#                 status_code=400,
#                 detail="each message role must be 'user' or 'assistant'",
#             )

#     try:
#         reply = await service.chat(
#             [{"role": m.role, "content": m.content} for m in body.messages]
#         )
#         return ChatResponse(message=reply)
#     except ValueError as exc:
#         raise HTTPException(status_code=500, detail=str(exc)) from exc
#     except Exception as exc:
#         raise HTTPException(status_code=502, detail=f"LLM error: {exc}") from exc

# #chat endpoint with restaurant search - alternative implementation
# @router.post("/chat", response_model=ChatResponse)
# async def chat_endpoint(body: ChatRequest, db: db_dependency):
#     ...
#     reply, restaurant = await service.chat_with_restaurant_search(
#         [{"role": m.role, "content":m.content} for m in body.messages], db,
#     )
#     return ChatResponse(message=reply, restaurants=restaurants
#     )

#chat endpoint with restaurant search - alternative implementation
@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(body: ChatRequest, db: db_dependency):
    if not body.messages:
        raise HTTPException(status_code=400, detail="messages required")

    for turn in body.messages:
        if turn.role not in ("user", "assistant"):
            raise HTTPException(status_code=400, detail="each message role must be 'user' or 'assistant'")

    try:
        reply, restaurants = await service.chat_with_restaurant_search(
            [{"role": m.role, "content": m.content} for m in body.messages],
            db,
            latitude=body.latitude,
            longitude=body.longitude,
        )
        return ChatResponse(message=reply, restaurants=restaurants)
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"LLM error: {exc}") from exc