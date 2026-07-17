from .base_model import DBBaseModelTimeMixIn, DBBaseModelIdMixin, PydanticJSONType
from src.database.connection import Base
import uuid_utils.compat as uuid
from sqlalchemy import String, Uuid, ForeignKey, Text, Integer
from sqlalchemy.orm import mapped_column, Mapped
from src.database.schemas.reviews import SENTIMENT_TYPE, SentimentModelValidation


class ReviewModel(DBBaseModelTimeMixIn, DBBaseModelIdMixin,Base):
    __tablename__ ='reviews'
    
    content: Mapped[str]= mapped_column(Text, nullable=False)
    # reviewer_id: Mapped[uuid.UUID]= mapped_column(Uuid, ForeignKey('users.id'), nullable=True, index=True)
    restaurant_id: Mapped[uuid.UUID]= mapped_column(Uuid, ForeignKey('restaurants.id'), nullable=False, index=True)
    stars:Mapped[int] = mapped_column(Integer, nullable=False)
    sentiment:Mapped[SENTIMENT_TYPE] = mapped_column(String(8), nullable=True)
    theme:Mapped[SentimentModelValidation]= mapped_column(PydanticJSONType(SentimentModelValidation), nullable=True)

