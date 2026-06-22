from src.database.connection import Base
from sqlalchemy import String, ForeignKey
import uuid
from uuid import UUID
from sqlalchemy.orm import mapped_column, Mapped
from sqlalchemy import func,Uuid
from pydantic import Field, EmailStr
from typing import Literal, Optional
from .base_model import DBBaseModelMixIn, DBBaseRequest

class UserRequest(DBBaseRequest):
    full_name: str= Field(min_length=3, max_length=256)
    email:EmailStr = Field()
    user_type:Literal["client","owner"] = Field()

class UserModel(DBBaseModelMixIn, Base):
    __tablename__ ='users'
    user_type: Mapped[Literal["client","owner"]] = mapped_column(String, nullable=False)
    full_name: Mapped[str]= mapped_column(String, nullable=False)
    email:Mapped[EmailStr]= mapped_column(String, unique=True)
    id:Mapped[uuid.UUID] = mapped_column(
            Uuid, 
            primary_key=True, 
            index=True, 
            server_default=func.uuidv7(),
            default=func.uuidv7(),
        )
    __mapper_args__ = {'polymorphic_on': user_type}

class ClientRequest(UserRequest):
    # PreFill as default
    user_type:Literal['client'] = Field("client")# type: ignore[assignment]
    avatar_url:Optional[str] = Field(None)

class ClientModel(UserModel):
    __tablename__ ='clients'
    id:Mapped[uuid.UUID] = mapped_column(
            Uuid, 
            ForeignKey('users.id'),
            primary_key=True, 
            index=True, 
            nullable=False, 
            server_default=func.uuidv7(),
            default=func.uuidv7()
        )
    avatar_url:Mapped[Optional[str]]= mapped_column(String, default=None)
    __mapper_args__ = {
        'polymorphic_identity': 'client', 
        'inherit_condition': id == UserModel.id # Explicitly tell SQLAlchemy how to join
        }


class OwnerRequest(UserRequest):
    # PreFill as default
    user_type:Literal['owner'] = Field("owner")# type: ignore[assignment]
    restaurant_name:str = Field()

class OwnerModel(UserModel):
    __tablename__ ='owners'
    restaurant_name:Mapped[str]= mapped_column(String, nullable=False, kw_only=True)
    id:Mapped[UUID] = mapped_column(
            Uuid, 
            ForeignKey('users.id'),
            primary_key=True, 
            index=True, 
            nullable=False, 
            server_default=func.uuidv7(),
            default=func.uuidv7(),
        )
    __mapper_args__ = {
        'polymorphic_identity': 'owner',
        'inherit_condition': id == UserModel.id # Explicitly tell SQLAlchemy how to join
        }

