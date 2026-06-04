from fastapi import APIRouter, Path, HTTPException
from src.database.connection import get_db, db_dependency

router = APIRouter(prefix='/users', tags=['user'])

@router.get('/ping')
async def get_books(db: db_dependency):
    return {'ping':'pong'}

