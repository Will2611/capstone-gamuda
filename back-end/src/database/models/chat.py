from typing import Optional
from src.database.connection import Base
from .base_model import DBBaseModelTimeMixIn, DBBaseModelIdMixin
from sqlalchemy import String, Uuid, ARRAY,ForeignKey
from sqlalchemy import  CheckConstraint, and_, or_
from uuid_utils.compat import UUID
from typing import Literal
from sqlalchemy.orm import mapped_column, Mapped


class ChatMessageModel(DBBaseModelTimeMixIn,Base, DBBaseModelIdMixin):
    __tablename__='chat_messages'
    message: Mapped[str] = mapped_column(String, nullable=False)
    room_id: Mapped[UUID]= mapped_column(Uuid, ForeignKey('chat_rooms.id'), nullable=False)
    user_id: Mapped[UUID]= mapped_column(Uuid, ForeignKey('users.id'), nullable=True) #Allow null for LLM only, may change to be different uesr id if we want to model-versioning?
    # Useful for as only chatlogs with payloads are llm suggestions, replacement for search History id
    payloads_stringified:Mapped[str] = mapped_column(String, nullable=True)


# Chat types
chat_types= ["human_casual", "llm_suggestions"]
room_statuses = ["active", "expired"]

# Future?
# chat_types_addition= ["restaurant_service", "bite_scout_service_owner", "bite_scout_service_customer"]
# chat_types_llm=["bite_scout_ai_owner", "bite_scout_ai_customer"]

class ChatRoomModel(DBBaseModelTimeMixIn,Base, DBBaseModelIdMixin):
    __tablename__='chat_rooms'
    creator_id: Mapped[UUID]= mapped_column(Uuid, ForeignKey('users.id'), nullable=False)
    participants_id:Mapped[list[UUID]]= mapped_column(ARRAY(Uuid(as_uuid=True)),nullable=True)
    # Make sure to check later and update to chat_types
    chat_type:Mapped[Literal["human_casual", "llm_suggestions"]]=mapped_column(String, nullable=False)
    room_status:Mapped[Literal["active", "expired"]]=mapped_column(String, nullable=False)
    
    chat_name:Mapped[Optional[str]]=mapped_column(String)
    chat_caption:Mapped[Optional[str]]=mapped_column(String)
    
    # Will always exist if both parties are human
    connection_id:Mapped[UUID]= mapped_column(Uuid, ForeignKey('personal_connections.id'), nullable=True)

    __table_args__ = (
        CheckConstraint(
            chat_type.in_(chat_types),
            name="ck_chat_type"
        ),
        CheckConstraint(
            room_status.in_(room_statuses),
            name="ck_room_status"
        ),
        CheckConstraint(
            or_(
                chat_type.in_(["llm_suggestions"]),
                connection_id.is_not(None),
                ),
        )
    )

