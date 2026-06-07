from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.database.connection import create_tables
from pydantic import BaseModel, StrictInt, Field
from src.database.controllers import all_routers
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



class BookRequest(BaseModel):
    title: str= Field(min_length=3, max_length=1000)
    author: str= Field(min_length=3, max_length=255)
    published_year: StrictInt= Field(gt=1800, lt=2026)




@app.get('/')
async def read_root():
    return {'message':'Hello World'}

for router_file in all_routers:
    app.include_router(router_file)