from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# Important for creating tables, to import the base model
from .database.schemas import *
from src.database.connection import create_tables, drop_tables
from src.database.controllers import routers
from src.llm.router import router as llm_router
import os

    
app = FastAPI()
create_tables()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FE_HOST", "http://localhost:5173")],
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
