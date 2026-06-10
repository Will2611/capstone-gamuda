from src.database.connection import Base
from sqlalchemy import Column, String, Integer, ForeignKey
from pydantic import   Field, EmailStr
from .base_model import DBBaseModelMixIn, DBBaseRequest

class UserRequest(DBBaseRequest):
    full_name: str= Field(min_length=3, max_length=256)
    email:EmailStr = Field()

class UserModel(DBBaseModelMixIn, Base):
    __tablename__ ='users'
    user_type = Column(String, nullable=False)
    full_name= Column(String, nullable=False)
    email= Column(String)
    __mapper_args__ = {'polymorphic_on': user_type}

class ClientModel(UserModel):
    __tablename__ ='clients'
    __mapper_args__ = {'polymorphic_identity': 'client'}
    id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    avatar_url= Column(String)

class OwnerModel(UserModel):
    __tablename__ ='owners'
    __mapper_args__ = {'polymorphic_identity': 'owner'}
    id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    restaurant_name= Column(String, nullable=False)

