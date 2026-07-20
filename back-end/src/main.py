from fastapi import FastAPI, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
# Important for creating tables, to import the base model
from .database.models import *
from src.database.connection import create_tables, drop_tables, engine
from src.database.migrate_visibility import ensure_visibility_schema
from src.database.controllers import routers
from src.llm.router import router as llm_router
from .jwt import ensure_default_cookie, CookieCustom, setCookie,default_session_generator
import os

    
app = FastAPI(dependencies=[Depends(ensure_default_cookie)])
ensure_visibility_schema(engine)
create_tables()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FE_HOST", "http://localhost:5173"),
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get('/')
async def read_root(response:Response):
    
    return {'message':'Hello World'}

@app.delete('/delete')
async def drop_all_tables():
    drop_tables()
    create_tables()
    return {'Dropped all tables and recreated'}

@app.post('/recreate')
# async def recreate_tables():
async def recreate_tables(response:Response,sessionToken:CookieCustom):
    print(sessionToken)
    # sessionToken.role = 'client'
    setCookie(response, sessionToken)
    return {'Recreate all tables and recreated'}

app.include_router(llm_router)

for router_file in routers:
    app.include_router(router_file)
