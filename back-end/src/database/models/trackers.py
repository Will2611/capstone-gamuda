from .base_model import DBBaseModelTimeMixIn, DBBaseModelIdMixin
from src.database.connection import Base
import uuid_utils.compat as uuid
from sqlalchemy import String, Uuid, ForeignKey
from sqlalchemy.orm import mapped_column, Mapped
from typing import Literal
TRACK_TYPE= Literal["Impression","Click", "Visit"]

class TrackerModel(DBBaseModelTimeMixIn, DBBaseModelIdMixin,Base):
    __tablename__ ='trackers'
    
    tracked_type: Mapped[TRACK_TYPE]= mapped_column(String, nullable=False, index=True)
    user_id:Mapped[uuid.UUID] =  mapped_column(Uuid, ForeignKey('users.id'), nullable=False, index=True)
    restaurant_id: Mapped[uuid.UUID]= mapped_column(Uuid, ForeignKey('restaurants.id'), nullable=False, index=True)
    
