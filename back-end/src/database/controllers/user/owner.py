from fastapi import APIRouter
from src.database.connection import db_dependency


router = APIRouter(prefix='/owner', tags=['owner'])

@router.get('/ping-owner')
async def get_user_owners(db: db_dependency):
    return {'ping':'pong'}

@router.post('/validate-user-test')
async def get_users(db: db_dependency):
    
    return {'ping':'pong'}
