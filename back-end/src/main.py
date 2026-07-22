from fastapi import FastAPI, Depends, Response, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
# Important for creating tables, to import the base model
from .database.models import *
from src.database.connection import create_tables, drop_tables, engine
from src.database.migrate_visibility import ensure_visibility_schema
from src.database.controllers import routers
from src.llm.router import router as llm_router
from src.services.jwt import ensure_default_cookie, CookieCustom, setCookie
from src.database.controllers.utils import CurrentUser
import os

    
app = FastAPI(dependencies=[Depends(ensure_default_cookie)])
ensure_visibility_schema(engine)
create_tables()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FE_HOST", "http://localhost:5173")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


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
