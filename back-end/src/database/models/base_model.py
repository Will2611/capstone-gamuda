from src.database.connection import Base
from sqlalchemy import Column, Integer


# Example model for checker
# from pydantic import BaseModel, StrictInt, Field
# class BookRequest(BaseModel):
#     title: str= Field(min_length=3, max_length=1000)
#     author: str= Field(min_length=3, max_length=255)
#     published_year: StrictInt= Field(gt=1800, lt=2026)


class DBBaseModel(Base):
    id=Column(Integer, primary_key=True, index=True, nullable=False)