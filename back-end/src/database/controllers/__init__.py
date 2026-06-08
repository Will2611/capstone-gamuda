import os
from .utils import get_subcontrollers

dirname = os.path.dirname(os.path.abspath(__file__))
# routers=[]
routers = get_subcontrollers(dirname)
# allow from src.controllers import *
__all__ = ['routers']

# 3. Nest the subcontrollers into this parent router
# from .analytics import router as analytics_router
# router.include_router(analytics_router)

# Do not include "/user" here anymore, example in another file
# router = APIRouter(prefix="/analytics", tags=["Admin Analytics"])

# parent_router = APIRouter(tags['parent'])
# child1_router = APIRouter(tags['child']) # in another file
# child2_router = APIRouter(tags['child']) # in another file
# aggregate_router = APIRouter()
# aggregate_router.include_router(parent_router)

# dirname = os.path.dirname(os.path.abspath(__file__))
# routers = get_subcontrollers(dirname)                

# for sub_router in routers:
#     aggregate_router.include_router(sub_router)

# Final router is named router
# router = APIRouter(prefix='/parent')
# router.include_router(aggregate_router)