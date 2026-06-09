from src.database.connection import Base
from sqlalchemy import Column, String
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
    __mapper_args__ = {'polymorphic_identity': 'client'}
    avatar_url= Column(String)

class ClientModel(UserModel):
    __mapper_args__ = {'polymorphic_identity': 'owner'}
    restaurant_name= Column(String, nullable=False)

