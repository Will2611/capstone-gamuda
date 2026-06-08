from fastapi import APIRouter
from src.database.connection import db_dependency
from src.database.models.user import UserModel, UserRequest
import os
from src.database.controllers.utils import get_subcontrollers

user_router = APIRouter(tags=['users'])

@user_router.get('/ping')
async def get_users(db: db_dependency):
    return {'ping':'pong'}

@user_router.post('/validate-user-test')
async def get_users(db: db_dependency, inputUser:UserRequest):
    return {'ping':'pong'}



aggregate_router = APIRouter()
aggregate_router.include_router(user_router)

dirname = os.path.dirname(os.path.abspath(__file__))
routers = get_subcontrollers(dirname)                

for sub_router in routers:
    aggregate_router.include_router(sub_router)

router = APIRouter(prefix='/user')
router.include_router(aggregate_router)