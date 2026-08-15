from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class ChatRequest(BaseModel):
    conversation_id: Optional[int] = None
    message: str = Field(min_length=1, max_length=4000)


class ChatResponse(BaseModel):
    conversation_id: int
    message: str
    intent: str
    grounded: bool


class ConversationOut(ORMModel):
    id: int
    student_id: int
    title: str
    created_at: datetime
    messages: List["MessageOut"] = Field(default_factory=list)


class MessageOut(ORMModel):
    id: int
    conversation_id: int
    role: str
    content: str
    created_at: datetime


class ConversationCreate(BaseModel):
    title: str = "New conversation"


ConversationOut.model_rebuild()
