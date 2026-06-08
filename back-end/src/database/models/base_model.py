from src.database.connection import Base
from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.sql import func
from pydantic import BaseModel, StrictInt, Field, PastDatetime

# Example model for checker
# from pydantic import BaseModel, StrictInt, Field
# class BookRequest(BaseModel):
#     title: str= Field(min_length=3, max_length=1000)
#     author: str= Field(min_length=3, max_length=255)
#     published_year: StrictInt= Field(gt=1800, lt=2026)



class DBBaseRequest(BaseModel):
    id:StrictInt = Field(gt=0)
    time_created:PastDatetime =Field()

# Is supposed to include in mixin, what is expected in a base class
class DBBaseModelMixIn(object):
    id=Column(Integer, primary_key=True, index=True, nullable=False)
    created_at = Column(DateTime, default=func.now())
    # updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    updated_at = Column(DateTime, onupdate=func.now())