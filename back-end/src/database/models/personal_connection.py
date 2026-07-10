from src.database.connection import Base
from sqlalchemy import String,Uuid, Boolean, DateTime,ARRAY, Integer
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy import ForeignKey, text, CheckConstraint
import uuid_utils.compat as uuid
from sqlalchemy.orm import mapped_column, Mapped
from sqlalchemy.sql import expression
from typing import Literal,  List
from datetime import datetime
from .base_model import DBBaseModelTimeMixIn, DBBaseModelIdMixin

class BaseConnectionModel(DBBaseModelTimeMixIn, DBBaseModelIdMixin, Base):
    __tablename__ ='personal_connections'
    connection_type: Mapped[Literal["match","lobby" ]] = mapped_column(String, nullable=False)
    chat_room_id:Mapped[uuid.UUID] = mapped_column(
        Uuid, 
        ForeignKey('chat_rooms.id'),
        index=True, 
        nullable=True,
        init=False
        )
    creator_id: Mapped[uuid.UUID]= mapped_column(
        Uuid,
        ForeignKey('users.id'),
        nullable=False
        )
    # SQLalchemy server default, postgresql style query
    expired_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=text("NOW() + INTERVAL '3 days'"),
        init=False
        )
    __mapper_args__ = {'polymorphic_on': connection_type}
    __table_args__ = (
        CheckConstraint(
            connection_type.in_(["match", "lobby"]),
            name="ck_connection_type"
        ),
    )


class FoodMatchModel(BaseConnectionModel):
    __tablename__ ='matches'
    participant_id:Mapped[uuid.UUID]= mapped_column(
        Uuid,
        ForeignKey('users.id'),
        nullable=False,
        index=True
        )
    
    is_connected:Mapped[bool] = mapped_column(
        Boolean,
        server_default=expression.false()
        )

    id:Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey('personal_connections.id'),
        primary_key=True,
        index=True,
        nullable=False,
        init=False
        )
    
    __mapper_args__ = {
        'polymorphic_identity': 'match', 
        'inherit_condition': id == BaseConnectionModel.id # Explicitly tell SQLAlchemy how to join
        }

# Logic, person tries to joins room, succeeds only if empty or if roommanager (python) fails it
class LobbiesModel(BaseConnectionModel):
    __tablename__ ='lobbies'
    restaurant_id:Mapped[uuid.UUID] = mapped_column(
            Uuid, 
            ForeignKey('restaurants.id'),
            nullable=False,
            index=True
        )
    size_limit:Mapped[int] = mapped_column(
        Integer,
        nullable=False
        )
    participant_ids :Mapped[List[uuid.UUID]] = mapped_column(
        ARRAY(Uuid),
        index=False,
        )
    id:Mapped[uuid.UUID] = mapped_column(
            Uuid, 
            ForeignKey('personal_connections.id'),
            primary_key=True, 
            index=True, 
            nullable=False,
        )
        
    __mapper_args__ = {
        'polymorphic_identity': 'lobby',
        'inherit_condition': id == BaseConnectionModel.id # Explicitly tell SQLAlchemy how to join
        }
FoodMatchModel.is_connected