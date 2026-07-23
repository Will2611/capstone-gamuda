from fastapi import APIRouter, HTTPException, status, Response
from src.database.connection import db_dependency
import os
from src.database.controllers.utils import get_subcontrollers
from src.database.models.user import UserModel
from src.database.controllers.utils import create_access_token
from src.database.schemas.auth import LoginRequest, TokenResponse, AuthUserResponse
from src.services.jwt import CookieCustom, setCookie

user_router = APIRouter(tags=['users'])

@user_router.get('/ping',response_model=AuthUserResponse)
async def get_users_base(cookie_payload:CookieCustom, resp:Response):
    if cookie_payload.userId and cookie_payload.role:
        auth_user = AuthUserResponse(
            id=cookie_payload.userId,
            role=cookie_payload.role,
            )
        return auth_user
    raise HTTPException(status_code=401,detail='Missing auth cookie')

# @user_router.post('/validate-user-test')
# async def post_users_base(db: db_dependency):
#     return {'ping':'pong'}

@user_router.post("/login", response_model=AuthUserResponse) 
async def login(payload: LoginRequest, db: db_dependency, cookie_payload:CookieCustom, resp:Response):
    # 🔍 VERIFICATION STEP 1: Find user by email in the DB
    print('Reached emd[pomt]')
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
    
    # 📦 MAPPING STEP: Package data to match AuthUserResponse structure
    auth_user = AuthUserResponse(
        id=user.id,
        role=user.user_type,
        
    )
    cookie_payload.userId = user.id
    cookie_payload.role = user.user_type
    setCookie(resp,cookie_payload)
    print(cookie_payload)
    return auth_user

@user_router.delete('/logout', status_code=status.HTTP_204_NO_CONTENT)
async def user_logout(resp:Response, old_cookie:CookieCustom):
    setCookie(resp)
    return


aggregate_router = APIRouter()
aggregate_router.include_router(user_router)

dirname = os.path.dirname(os.path.abspath(__file__))
routers = get_subcontrollers(dirname)                

for sub_router in routers:
    aggregate_router.include_router(sub_router)

router = APIRouter(prefix='/user')
router.include_router(aggregate_router)

