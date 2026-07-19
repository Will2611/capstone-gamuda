from fastapi import APIRouter, HTTPException, status
from src.database.connection import db_dependency
import os
from src.database.controllers.utils import get_subcontrollers
from src.database.models.user import UserModel
from src.database.controllers.utils import create_access_token
from src.database.schemas.auth import LoginRequest, TokenResponse, AuthUserResponse

user_router = APIRouter(tags=['users'])

@user_router.get('/ping')
async def get_users_base(db: db_dependency):
    return {'ping':'pong'}

# @user_router.post('/validate-user-test')
# async def post_users_base(db: db_dependency):
#     return {'ping':'pong'}



aggregate_router = APIRouter()
aggregate_router.include_router(user_router)

dirname = os.path.dirname(os.path.abspath(__file__))
routers = get_subcontrollers(dirname)                

for sub_router in routers:
    aggregate_router.include_router(sub_router)

router = APIRouter(prefix='/user')
router.include_router(aggregate_router)

@router.post("/login", response_model=TokenResponse) 
async def login(payload: LoginRequest, db: db_dependency):
    # 🔍 VERIFICATION STEP 1: Find user by email in the DB
    user = db.query(UserModel).filter(UserModel.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # 🔍 VERIFICATION STEP 2: Compare input password against database hash
    is_valid_password = UserModel.comparePasswords(user.hashedPassword, payload.password)
    if not is_valid_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    # 🪙 TOKEN GENERATION STEP: Create session string
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "user_type": user.user_type}
    )
    
    # 📦 MAPPING STEP: Package data to match AuthUserResponse structure
    auth_user = AuthUserResponse(
        id=user.id,
        email=user.email,
        display_name=user.full_name,
        role=user.user_type,
        avatar_url=getattr(user, 'avatar_url', None)
    )
    
    return TokenResponse(
        access_token=access_token,
        user=auth_user
    )