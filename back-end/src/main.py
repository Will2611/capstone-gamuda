from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# Important for creating tables, to import the base model
from .database.schemas import *
from src.database.connection import create_tables, drop_tables
from src.database.controllers import routers
import os

    
app = FastAPI()
create_tables()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FE_HOST")],
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


for router_file in routers:
    app.include_router(router_file)