import uuid
from datetime import time, datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status

from src.database.connection import db_dependency
from src.database.models.promotion import PromotionModel
from src.database.schemas.promotion import (
    PromotionCreate,
    PromotionUpdate,
    PromotionResponse,
)

router = APIRouter(prefix="/promotions", tags=["promotions"])


def is_valid_uuid(val: str) -> bool:
    if not val:
        return False
    try:
        uuid.UUID(str(val))
        return True
    except (ValueError, TypeError, AttributeError):
        return False


def find_promotion_by_id_or_promo_id(db, promotion_id: str):
    if is_valid_uuid(promotion_id):
        target_uuid = uuid.UUID(str(promotion_id))
        return (
            db.query(PromotionModel)
            .filter(
                (PromotionModel.id == target_uuid) | 
                (PromotionModel.promo_id == promotion_id)
            )
            .first()
        )
    else:
        return (
            db.query(PromotionModel)
            .filter(PromotionModel.promo_id == promotion_id)
            .first()
        )


def parse_time_val(t) -> Optional[time]:
    if isinstance(t, time):
        return t
    if isinstance(t, str) and t.strip():
        val = t.strip()
        try:
            return datetime.strptime(val, "%H:%M:%S").time()
        except ValueError:
            try:
                return datetime.strptime(val, "%H:%M").time()
            except ValueError:
                return None
    return None


@router.get("", response_model=List[PromotionResponse])
async def list_promotions(
    db: db_dependency,
    restaurantId: Optional[str] = Query(None)
):
    query = db.query(PromotionModel)
    if restaurantId and is_valid_uuid(restaurantId):
        query = query.filter(PromotionModel.restaurant_id == uuid.UUID(restaurantId))
    return query.all()


@router.get("/{promotion_id}", response_model=PromotionResponse)
async def get_promotion(promotion_id: str, db: db_dependency):
    promotion = find_promotion_by_id_or_promo_id(db, promotion_id)
    if not promotion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Promotion not found"
        )
    return promotion


@router.post("", response_model=PromotionResponse, status_code=status.HTTP_201_CREATED)
async def create_promotion(promotion_in: PromotionCreate, db: db_dependency):
    promo_id = promotion_in.promoId or f"PROMO-{uuid.uuid4().hex[:8].upper()}"

    if promotion_in.promoId:
        existing = db.query(PromotionModel).filter(PromotionModel.promo_id == promotion_in.promoId).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Promotion with this promoId already exists."
            )

    new_promotion = PromotionModel(
        id=promotion_in.id or uuid.uuid4(),
        promo_id=promo_id,
        restaurant_id=promotion_in.restaurantId,
        title=promotion_in.title,
        description=promotion_in.description,
        image_url=promotion_in.imageUrl,
        website_url=promotion_in.websiteUrl or "",
        start_date=promotion_in.startDate,
        end_date=promotion_in.endDate,
        start_time=parse_time_val(promotion_in.startTime),
        end_time=parse_time_val(promotion_in.endTime),
        is_all_day=promotion_in.isAllDay,
        status=promotion_in.status or "ACTIVE",
    )

    db.add(new_promotion)
    db.commit()
    db.refresh(new_promotion)
    return new_promotion


@router.put("/{promotion_id}", response_model=PromotionResponse)
async def update_promotion(
    promotion_id: str, 
    promotion_in: PromotionCreate, 
    db: db_dependency
):
    promotion = find_promotion_by_id_or_promo_id(db, promotion_id)

    if not promotion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Promotion not found"
        )

    if promotion_in.restaurantId is not None:
        promotion.restaurant_id = promotion_in.restaurantId
    if promotion_in.title:
        promotion.title = promotion_in.title
    if promotion_in.description:
        promotion.description = promotion_in.description
    if promotion_in.imageUrl:
        promotion.image_url = promotion_in.imageUrl
    if promotion_in.websiteUrl is not None:
        promotion.website_url = promotion_in.websiteUrl
    if promotion_in.startDate:
        promotion.start_date = promotion_in.startDate
    if promotion_in.endDate:
        promotion.end_date = promotion_in.endDate
    
    promotion.start_time = parse_time_val(promotion_in.startTime)
    promotion.end_time = parse_time_val(promotion_in.endTime)
    promotion.is_all_day = promotion_in.isAllDay
    if promotion_in.status:
        promotion.status = promotion_in.status

    db.commit()
    db.refresh(promotion)
    return promotion


@router.delete("/{promotion_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_promotion(promotion_id: str, db: db_dependency):
    promotion = find_promotion_by_id_or_promo_id(db, promotion_id)

    if not promotion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Promotion not found"
        )

    db.delete(promotion)
    db.commit()
    return None
