from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.database.connection import create_tables
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

for router_file in routers:
    app.include_router(router_file)