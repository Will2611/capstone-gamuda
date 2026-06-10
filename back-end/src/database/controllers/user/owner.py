from fastapi import APIRouter
from src.database.connection import db_dependency
from src.database.schemas.user import UserModel, UserRequest

router = APIRouter(prefix='/owner', tags=['owner'])

@router.get('/ping-owner')
async def get_users(db: db_dependency):
    return {'ping':'pong'}

@router.post('/validate-user-test')
async def get_users(db: db_dependency, inputUser:UserRequest):
    
    return {'ping':'pong'}
