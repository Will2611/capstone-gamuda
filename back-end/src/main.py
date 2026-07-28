from fastapi import FastAPI, Depends, Response, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
# Important for creating tables, to import the base model
from .database.models import *
from src.database.connection import create_tables, drop_tables, engine
from src.database.migrate_visibility import ensure_visibility_schema
from src.database.controllers import routers
from src.llm.router import router as llm_router
from src.services.jwt import ensure_default_cookie, CookieCustom, setCookie, getCookiePayload, default_session_generator
from src.database.controllers.utils import CurrentUser
import os
# import src.routers as db_routers
from src.routers.analytics import router as analytics_router
from src.routers.ai_recommendations import router as ai_router

    
app = FastAPI()
ensure_visibility_schema(engine)
create_tables()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FE_HOST", "http://localhost:5173"),
        "https://bite-scouts.web.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.middleware("http")
async def cookie_middleware(request, call_next):
    """
    Replaces the old global Depends(ensure_default_cookie).
    Starlette only fires @app.middleware("http") for HTTP requests,
    so WebSocket connections are never affected.

    IMPORTANT: If the endpoint already set a cookie (e.g. login/logout),
    we must NOT overwrite it with the stale request cookie.
    """
    from src.services.jwt import TOKEN_NAME
    response = await call_next(request)
    try:
        # Check if the endpoint already set our session cookie
        token_name_bytes = TOKEN_NAME.encode()
        already_set = any(
            token_name_bytes in header_value
            for header_key, header_value in response.raw_headers
            if header_key == b"set-cookie"
        )
        if not already_set:
            parsed = getCookiePayload(request) or default_session_generator()
            setCookie(response, parsed)
    except Exception:
        pass
    return response


@app.get('/')
async def read_root():
    
    return {'message':'Hello World'}

@app.delete('/delete')
async def drop_all_tables(current_user: CurrentUser):
    """Dangerous: only when ALLOW_DB_RESET=true in the environment."""
    if os.getenv("ALLOW_DB_RESET", "false").lower() not in ("1", "true", "yes"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="DB reset is disabled. Set ALLOW_DB_RESET=true to enable.",
        )
    drop_tables()
    create_tables()
    return {'Dropped all tables and recreated'}

@app.post('/recreate')
# async def recreate_tables():
async def recreate_tables():
    
    return {'Recreate all tables and recreated'}

app.include_router(llm_router)

for router_file in routers:
    app.include_router(router_file)

# app.include_router(db_routers)
app.include_router(analytics_router)
app.include_router(ai_router)