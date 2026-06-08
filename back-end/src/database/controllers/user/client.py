from fastapi import APIRouter
from src.database.connection import db_dependency
from src.database.models.user import UserModel, UserRequest

router = APIRouter(prefix='/client', tags=['customer'])

@router.get('/ping-customer')
async def get_users(db: db_dependency):
    return {'ping':'pong'}

@router.post('/validate-user-test')
async def get_users(db: db_dependency, inputUser:UserRequest):
    return {'ping':'pong'}
