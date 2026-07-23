# from fastapi import APIRouter
# from src.database.connection import db_dependency
# from src.database.schemas.user import  ClientRequest
# from src.database.models.user import  ClientModel

# router = APIRouter(prefix='/client', tags=['customer'])

# @router.get("/ping-customer")
# async def get_clients(db: db_dependency):
#     return db.query(ClientModel).all()

# @router.post("/validate-user-test")
# async def create_client(db: db_dependency, inputUser:ClientRequest):
#     new_client = ClientModel(
#         full_name= inputUser.full_name,
#         email=inputUser.email,
#         avatar_url=inputUser.avatar_url,
#         user_type=inputUser.user_type
#     )
#     try:
#         db.add(new_client)
#         db.commit()
#         db.refresh(new_client)
#         return {'message' :'User Recorded success'}
#     except Exception as e:
#         return {'failure' :f'{e}'}
        
from src.services.jwt import CookieCustom
import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status

# Database dependencies & models
from src.database.connection import db_dependency
from src.database.models.user import ClientModel, UserModel
from src.database.controllers.utils import CurrentUser

# Schemas (Pydantic models)
from src.database.schemas.user import ClientRegisterRequest, ClientResponse
from uuid_utils.compat import UUID

# Auth dependencies (Adjust path if your auth dependency lives elsewhere, e.g., src.auth.deps)
# from src.database.schemas.auth import get_current_client_user

router = APIRouter(prefix='/client', tags=['customer'])


@router.get("/personal_profile")
async def get_client_info(db: db_dependency, cookie_payload:CookieCustom):
    uuid = cookie_payload.userId
    if(uuid is None):
        raise HTTPException(status_code=404, detail="User ID is missing")
    user_result = db.query(ClientModel).filter(ClientModel.id == uuid).first()

    if user_result is None: 
        raise HTTPException(status_code=404, detail="User not found")
     
    return {
        "id": str(user_result.id),
        "email": user_result.email,
        "display_name": user_result.full_name,
        "avatar_url": user_result.avatar_url,
        "user_type": user_result.user_type,
        "gender": user_result.gender,
        "birthday": str(user_result.birth_date) if user_result.birth_date else None,
        "religion": user_result.religion,
        "language": user_result.language,
        "personalities": user_result.food_personality or [],
        "savedPreferences": {
            "cuisine": user_result.cuisine or [],
            "priceRange": user_result.price_limit or [],
            "dietary": user_result.dietary or [],
            "distance": str(int(user_result.distance_limit)) if user_result.distance_limit else "5",
            "ambience": user_result.preferred_vibes or [],
            "time": user_result.preferred_time or "",
        },
        "searchHistory": [],
        "favoriteRestaurants": []
    }


@router.post("/register")
async def register_client(db: db_dependency, payload: ClientRegisterRequest):
    # 1. Check if email already exists
    existing_user = db.query(UserModel).filter(UserModel.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # 2. Extract distance limit safely from preference string ("5km" -> 5.0)
    try:
        dist_str = payload.preferences.distance.replace("km", "").strip() if payload.preferences.distance else "5"
        distance_limit = float(dist_str)
    except ValueError:
        distance_limit = 5.0

    # 3. Hash password
    hashed_password = UserModel.hash_password(payload.password)

    # Parse preferred time from frontend string if available
    parsed_times = []
    if payload.preferences.time:
        try:
            # Assumes format "HH:MM" or "HH:MM:SS"
            time_obj = datetime.time.fromisoformat(payload.preferences.time)
            parsed_times.append(time_obj)
        except ValueError:
            pass  # Fallback to empty list if formatting fails

    # 4. Instantiate the Polymorphic ClientModel
    new_client = ClientModel(
        # Base UserModel fields
        full_name=payload.full_name,
        email=payload.email,
        hashedPassword=hashed_password,
        user_type="client", 
        
        # Unique ClientModel fields
        gender=payload.gender,
        birth_date=payload.birthday,       
        religion=payload.religion,
        language=payload.language,
        avatar_url=payload.profile_image,
        food_personality=payload.personalities,
        preferred_vibes=payload.preferences.ambience,  # Maps to ARRAY(String)
        price_limit=payload.preferences.priceRange,  # Maps to ARRAY(String)
        distance_limit=distance_limit,
        preferred_time=payload.preferences.time,
        cuisine=payload.preferences.cuisine or [],
        dietary=payload.preferences.dietary or [],
        ambience=payload.preferences.ambience or [],
    )

    try:
        db.add(new_client)
        db.commit()
        db.refresh(new_client)
        return {'status': 'success', 'message': 'Client registered successfully'}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database execution failed: {str(e)}"
        )

from pydantic import BaseModel
class Preferences(BaseModel):
    cuisine: list[str] = []
    priceRange: list[str] = []
    dietary: list[str] = []
    distance: float
    ambience: list[str] = []
    time: str = ""

class updateRequest(BaseModel):
    username: str
    profileImage: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[datetime.date] = None
    religion: Optional[str] = None
    language: Optional[str] = None
    preferences: Preferences
    personalities: list[str] = []

@router.put("/{uuid}")
async def update_profile(
    db: db_dependency,
    uuid: UUID,
    update_request: updateRequest,
    current_user: CurrentUser,
):
     if current_user.id != uuid:
          raise HTTPException(status_code=403, detail="Cannot update another user's profile")

     update_result = db.query(ClientModel).filter(ClientModel.id == uuid).first()

     if update_result is None: 
          raise HTTPException(status_code=404, detail="User not found")

     update_result.full_name = update_request.username
     update_result.avatar_url = update_request.profileImage
     update_result.gender = update_request.gender
     update_result.birth_date = update_request.birthday
     update_result.religion = update_request.religion # pyright: ignore[reportAttributeAccessIssue]
     update_result.language = update_request.language # pyright: ignore[reportAttributeAccessIssue]
     update_result.cuisine = update_request.preferences.cuisine
     update_result.price_limit = update_request.preferences.priceRange
     update_result.dietary = update_request.preferences.dietary
     update_result.distance_limit = update_request.preferences.distance
     update_result.preferred_vibes = update_request.preferences.ambience
     update_result.preferred_time = update_request.preferences.time
     update_result.food_personality = update_request.personalities

     db.add(update_result)
     db.commit()
     return {"message": "User profile updated successfully"}