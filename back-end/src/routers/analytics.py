from fastapi import APIRouter
from src.database.connection import db_dependency
from src.database.models.promotion import PromotionModel
from src.services.google_sheets import sheet_service
from src.database.schemas.promotion import PromotionResponse

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/dashboard-data")
async def get_dashboard_analytics(db: db_dependency):
    # 1. 从 Google Sheet 获取数据
    sheet_data = sheet_service.fetch_dashboard_sheet_data()
    
    # 2. 查询 PostgreSQL 数据库
    db_promotions = db.query(PromotionModel).all()
    # Serialize promotions using Pydantic schema
    serialized_promos = [PromotionResponse.from_orm(p).dict() for p in db_promotions]
    # 3. 统一返回结构 (全部改为安全的 menu_items)
    return {
        "step1_data": {
            "menu_items": sheet_data["menu_items"],
            "customer_segments": sheet_data["customer_segments"],
            "financial_summary": sheet_data["financial_summary"]
        },
        "step2_data": {
            "historical_campaigns": serialized_promos
        }
    }