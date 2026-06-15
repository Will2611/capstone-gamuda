from fastapi import APIRouter
from src.database.connection import db_dependency
from src.database.schemas.user import  ClientModel, ClientRequest

router = APIRouter(prefix='/client', tags=['customer'])

@router.get("/ping-customer")
async def get_clients(db: db_dependency):
    return db.query(ClientModel).all()

@router.post("/validate-user-test")
async def create_client(db: db_dependency, inputUser:ClientRequest):
    new_client = ClientModel(
     full_name= inputUser.full_name,email=inputUser.email, avatar_url=inputUser.avatar_url
    )
    try:
        db.add(new_client)
        db.commit()
        db.refresh(new_client)
        return {'message' :'User Recorded success'}
    except Exception as e:
        return {'failure' :f'{e}'}
        
