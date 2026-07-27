from fastapi import APIRouter, HTTPException, status, Response
from src.database.connection import db_dependency
import os
from src.database.controllers.utils import get_subcontrollers
from src.database.models.user import UserModel
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
    cookie_payload.remember_me = payload.rememberMe
    setCookie(resp,cookie_payload)
    
    return auth_user

from src.database.schemas.user import UserSubscription
from src.database.controllers.utils import CurrentUser
@user_router.post('/logout', status_code=status.HTTP_204_NO_CONTENT)
async def user_logout(resp:Response, cookie:CookieCustom, db:db_dependency, subscription:UserSubscription| None,):
    if cookie.userId is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
            )
    current_user = db.query(UserModel).filter(UserModel.id == cookie.userId).first()
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
        
    
    if subscription and current_user.user_notifications:
        
        current_user.user_notifications = [r for r in current_user.user_notifications if r.endpoint!=subscription.endpoint]
        db.commit()
    setCookie(resp)
    return

@user_router.post('/add-notification', status_code=status.HTTP_204_NO_CONTENT)
async def user_notifications(resp:Response, cookie:CookieCustom, db:db_dependency, subscription:UserSubscription):
    if cookie.userId is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
            )
    
    current_user = db.query(UserModel).filter(UserModel.id == cookie.userId).first()
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
        
    
    old_notifications = current_user.user_notifications or []
    old_endpoints = set([r.endpoint for r in old_notifications])
    if subscription.endpoint in old_endpoints:
        current_user.user_notifications = [*old_notifications, subscription ]
        db.commit()
    
    return


aggregate_router = APIRouter()
aggregate_router.include_router(user_router)

dirname = os.path.dirname(os.path.abspath(__file__))
routers = get_subcontrollers(dirname)                

for sub_router in routers:
    aggregate_router.include_router(sub_router)

router = APIRouter(prefix='/user')
router.include_router(aggregate_router)


import time
from fastapi import HTTPException, status
# Pydantic Schemas for Validation


#  Step 1 & 2: Generate a secure endpoint for the browser to upload into


from src.services.image_bucket import get_upload_url, UploadRequest

@user_router.post("/api/get-upload-url")
async def get_profile_upload_url(payload: UploadRequest) -> dict[str, str]:
    # Enforce correct image mime types
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if payload.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid image format. Only JPEG, PNG, and WebP are allowed."
        )

    # Establish keys and naming
    file_extension = payload.content_type.split("/")[-1]
    file_key = f"image/avatars/{payload.user_id}-{int(time.time())}.{file_extension}"
    try:
        return await get_upload_url(payload, file_key)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate presigned URL: {str(e)}"
        )

    # Your public tracking domain configured in Cloudflare Dashboard
