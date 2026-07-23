import uuid
import datetime
from fastapi import APIRouter, HTTPException, status

from src.database.connection import db_dependency
from src.database.models.user import OwnerModel, UserModel
from src.database.models.restaurants import RestaurantModel, GeohashHelper
from src.database.schemas.auth import OwnerRegisterRequest, RegisterSuccessResponse, AuthUserResponse
from zoneinfo import ZoneInfo

router = APIRouter(prefix='/owner', tags=['owner'])

@router.get('/ping-owner')
async def get_user_owners(db: db_dependency):
    return {'ping':'pong'}

@router.post('/validate-user-test')
async def get_users(db: db_dependency):
    
    return {'ping':'pong'}

@router.post(
    "/register",
    response_model=RegisterSuccessResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_owner(payload: OwnerRegisterRequest, db: db_dependency):
    existing_user = db.query(UserModel).filter(UserModel.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already registered.",
        )

    try:
        hashed_pwd = UserModel.hash_password(payload.password)
        rest_data = payload.restaurant
        addr_data = rest_data.address

        lat = addr_data.latitude if addr_data.latitude is not None else 0.0
        lng = addr_data.longitude if addr_data.longitude is not None else 0.0

        address_list = [
            addr_data.street,
            addr_data.postcode,
            addr_data.city,
            addr_data.state,
            addr_data.country,
        ]

        # 1. Instantiate & flush Restaurant
        new_restaurant = RestaurantModel(
            name=rest_data.name,
            rating=0.0,
            longitude=lng,
            latitude=lat,
            about=f"Welcome to {rest_data.name}!",
            contact_no=rest_data.contact_number or "",
            address=address_list,
            timezone="Asia/Kuala_Lumpur",
            timezone_offset=480,
            opening_hours_struct={},
            source="owner_registration",
            google_place_id=None,
            cuisine=rest_data.cuisine_types,
            dietary=rest_data.dietary_needs,
            ambience=rest_data.ambience_vibes,
        )


        db.add(new_restaurant)
        db.flush() # Flush so new_restaurant.id is available for FK constraint

        # 2. Instantiate OwnerModel without passing 'id' directly to __init__
        new_owner = OwnerModel(
            restaurant_id=new_restaurant.id,
            full_name=payload.display_name,
            email=payload.email,
            hashedPassword=hashed_pwd,
            user_type="owner",
            avatar_url=payload.profile_image,
            verified_owner=False,
        )

        db.add(new_owner)
        db.commit()
        db.refresh(new_owner)

        return RegisterSuccessResponse(
            message="Restaurant owner registered successfully!",
            user=AuthUserResponse.model_validate(new_owner)
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register restaurant owner: {str(e)}",
        )