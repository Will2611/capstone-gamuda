from src.database.connection import Base
from sqlalchemy import  DateTime, func
from sqlalchemy.orm import mapped_column, Mapped
from datetime import datetime
from pydantic import BaseModel, Field, UUID7
from typing import Optional

# Example model for checker
# from pydantic import BaseModel, StrictInt, Field
# class BookRequest(BaseModel):
#     title: str= Field(min_length=3, max_length=1000)
#     author: str= Field(min_length=3, max_length=255)
#     published_year: StrictInt= Field(gt=1800, lt=2026)



class DBBaseRequest(BaseModel):
    # For updating users
    id:Optional[UUID7]= Field(None)

# Is supposed to include in mixin, what is expected in a base class
class DBBaseModelMixIn(object):
    # id is manual, could be overwritten in case of is also Foreign Key in case of joint table inheritance
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at:Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=datetime.now())
    
