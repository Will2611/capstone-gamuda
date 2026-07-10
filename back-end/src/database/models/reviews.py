from .base_model import DBBaseModelTimeMixIn, DBBaseModelIdMixin
from src.database.connection import Base
import uuid_utils.compat as uuid
from sqlalchemy import String, Uuid, ForeignKey, Text
from sqlalchemy.orm import mapped_column, Mapped
from typing import Literal
SENTIMENT_TYPE= Literal["Positive","Negative", "Mixed", "Neutral"]

class ReviewModel(DBBaseModelTimeMixIn, DBBaseModelIdMixin,Base):
    __tablename__ ='reviews'
    
    content: Mapped[str]= mapped_column(Text, nullable=False)
    # reviewer_id: Mapped[uuid.UUID]= mapped_column(Uuid, ForeignKey('users.id'), nullable=True, index=True)
    restaurant_id: Mapped[uuid.UUID]= mapped_column(Uuid, ForeignKey('restaurants.id'), nullable=False, index=True)
    sentiment:Mapped[SENTIMENT_TYPE] = mapped_column(String(8), nullable=True)
    theme:Mapped[str]= mapped_column(Text, nullable=True)