from fastapi import APIRouter, HTTPException, status, Response
from src.database.connection import db_dependency
import os
from src.database.controllers.utils import get_subcontrollers
from src.database.models.user import UserModel
from src.database.controllers.utils import create_access_token
from src.database.schemas.auth import LoginRequest, TokenResponse, AuthUserResponse
from src.jwt import CookieCustom, setCookie

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
async def login(payload: LoginRequest, db: db_dependency, cookie_payload:CookieCustom, resp:Response):
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
        displayName=user.full_name,
        role=user.user_type,
        avatarUrl=getattr(user, 'avatar_url', None)
    )
    cookie_payload.userId = user.id
    cookie_payload.role = user.user_type
    setCookie(resp,cookie_payload)
    return TokenResponse(
        access_token=access_token,
        user=auth_user
    )

@router.delete('/logout', status_code=status.HTTP_204_NO_CONTENT)
async def user_logout(resp:Response):
    setCookie(resp)
    return
import os
import time
from typing import Dict
from fastapi import HTTPException, status
from pydantic import BaseModel


# Pydantic Schemas for Validation
class UploadRequest(BaseModel):
    user_id: int
    content_type: str

class ConfirmationRequest(BaseModel):
    user_id: int
    public_file_url: str



#  Step 1 & 2: Generate a secure endpoint for the browser to upload into


from src.database.connection import r2_client

@user_router.post("/api/get-upload-url")
def get_profile_upload_url(db: db_dependency,payload: UploadRequest) -> Dict[str, str]:
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
        # Generate an upload URL that expires in 5 minutes (300 seconds)
        presigned_url='Something here'
        # raise Exception('Missing r2client')
        presigned_url:str = r2_client.get_presigned_url(file_key=file_key,content_type=payload.content_type)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate presigned URL: {str(e)}"
        )

    # Your public tracking domain configured in Cloudflare Dashboard
    public_file_url = f"https://example.com/{file_key}"

    return {
        "presigned_url": presigned_url,
        "public_file_url": public_file_url
    }



#  Step 4: Save only the text reference string to PostgreSQL

# @user_router.post("/api/confirm-profile-update")
# def confirm_profile_update(db: db_dependency,payload: ConfirmationRequest):
#     try:
#         user = db.query(UserModel).filter(UserModel.id == payload.user_id).first()  
#         if not user:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND, 
#                 detail="User not found"
#                 )
        
#     except HTTPException:
#         raise # Reraise the 404 cleanly
#     except Exception as e:
#         db.rollback() # Clean up connection state if things went wrong
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Database update failed: {str(e)}"
#         )
#     return {"message": "Profile picture updated successfully"}
