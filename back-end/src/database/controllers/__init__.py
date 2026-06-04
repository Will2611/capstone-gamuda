from .user import router as user_router

all_routers = [
    user_router
]

# 3. Nest the subcontrollers into this parent router
# from .analytics import router as analytics_router
# router.include_router(analytics_router)

# Do not include "/user" here anymore, example in another file
# router = APIRouter(prefix="/analytics", tags=["Admin Analytics"])
