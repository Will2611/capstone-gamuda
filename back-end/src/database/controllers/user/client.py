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
        
import datetime
from fastapi import APIRouter, Depends, HTTPException, status

# Database dependencies & models
from src.database.connection import db_dependency
from src.database.models.user import ClientModel, UserModel

# Schemas (Pydantic models)
from src.database.schemas.user import ClientRegisterRequest, ClientResponse

# Auth dependencies (Adjust path if your auth dependency lives elsewhere, e.g., src.auth.deps)
# from src.database.schemas.auth import get_current_client_user

router = APIRouter(prefix='/client', tags=['customer'])


# @router.get("/user/client/me", response_model=ClientResponse)
# async def get_client_profile(current_user: ClientModel = Depends()):
#     return current_user


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
        preferred_vibes=payload.preferences.ambience, # Maps to ARRAY(String)
        price_limit=payload.preferences.priceRange,   # Maps to ARRAY(String)
        distance_limit=distance_limit,
        preferred_time=payload.preferences.time,
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