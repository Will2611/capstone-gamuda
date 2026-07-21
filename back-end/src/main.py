from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# Important for creating tables, to import the base model
from .database.models import *
from src.database.connection import create_tables, drop_tables, engine
from src.database.migrate_visibility import ensure_visibility_schema
from src.database.controllers import routers
from src.llm.router import router as llm_router
import os

    
app = FastAPI()
create_tables()
ensure_visibility_schema(engine)

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
async def read_root():
    return {'message':'Hello World'}

@app.delete('/delete')
async def drop_all_tables():
    drop_tables()
    create_tables()
    return {'Dropped all tables and recreated'}

app.include_router(llm_router)

for router_file in routers:
    app.include_router(router_file)
