from src.database.connection import Base
from sqlalchemy import Column, String, UUID, ForeignKey
from sqlalchemy import func
from pydantic import   Field, EmailStr, S
from typing import Literal, Optional
from .base_model import DBBaseModelMixIn, DBBaseRequest

class UserRequest(DBBaseRequest):
    full_name: str= Field(min_length=3, max_length=256)
    email:EmailStr = Field()
    user_type:Literal["client","owner"] = Field()

class UserModel(DBBaseModelMixIn, Base):
    __tablename__ ='users'
    id = Column(
            UUID(as_uuid=True), 
            primary_key=True, 
            index=True, 
            nullable=False, 
            default=func.uuidv7()
        )
    user_type = Column(String, nullable=False)
    full_name= Column(String, nullable=False)
    email= Column(String, unique=True)
    __mapper_args__ = {'polymorphic_on': user_type}

class ClientRequest(UserRequest):
    # PreFill as default
    user_type:Literal['client'] = Field("client")
    avatar_url:Optional[str] = Field(None)

class ClientModel(UserModel):
    __tablename__ ='clients'
    id = Column (UUID(as_uuid=True), 
            ForeignKey('users.id'),
            primary_key=True, 
            index=True, 
            nullable=False, 
            default=func.uuidv7()
        )
    avatar_url= Column(String)
    __mapper_args__ = {
        'polymorphic_identity': 'client', 
        'inherit_condition': id == UserModel.id # Explicitly tell SQLAlchemy how to join
        }


class OwnerRequest(UserRequest):
    # PreFill as default
    user_type:Literal['owner'] = Field("owner")
    restaurant_name:str = Field()

class OwnerModel(UserModel):
    __tablename__ ='owners'
    id = Column(
            UUID(as_uuid=True), 
            ForeignKey('users.id'),
            primary_key=True, 
            index=True, 
            nullable=False, 
            default=func.uuidv7(),
        )
    restaurant_name= Column(String, nullable=False)
    __mapper_args__ = {
        'polymorphic_identity': 'owner',
        'inherit_condition': id == UserModel.id # Explicitly tell SQLAlchemy how to join
        }

