"""AI assistant endpoints (student only)."""

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_student_record
from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.core.security import require_student
from app.models.ai_conversation import AiConversation
from app.models.user import User
from app.schemas.ai import ChatRequest, ChatResponse, ConversationOut, MessageOut
from app.schemas.common import MessageResponse
from app.services.ai_service import handle_chat

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


@router.post("/chat", response_model=ChatResponse, summary="Ask the AI assistant")
def chat(
    payload: ChatRequest,
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    student = get_student_record(db, user)
    result = handle_chat(db, student, payload.message, payload.conversation_id)
    return ChatResponse(**result)


@router.get("/conversations", response_model=List[ConversationOut], summary="My conversations")
def list_conversations(
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    student = get_student_record(db, user)
    return (
        db.query(AiConversation)
        .filter(AiConversation.student_id == student.id)
        .order_by(AiConversation.created_at.desc())
        .all()
    )


@router.post("/conversations", response_model=ConversationOut, summary="Start a conversation")
def create_conversation(
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    from app.services.ai_service import _get_or_create_conversation

    student = get_student_record(db, user)
    conversation = _get_or_create_conversation(db, student, None)
    db.commit()
    return conversation


@router.get("/conversations/{conversation_id}", response_model=ConversationOut, summary="Get a conversation with messages")
def get_conversation(
    conversation_id: int,
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    student = get_student_record(db, user)
    conversation = (
        db.query(AiConversation)
        .filter(AiConversation.id == conversation_id, AiConversation.student_id == student.id)
        .first()
    )
    if conversation is None:
        raise NotFoundError("Conversation not found.", code="CONVERSATION_NOT_FOUND")
    return conversation


@router.delete("/conversations/{conversation_id}", response_model=MessageResponse, summary="Delete a conversation")
def delete_conversation(
    conversation_id: int,
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    student = get_student_record(db, user)
    conversation = (
        db.query(AiConversation)
        .filter(AiConversation.id == conversation_id, AiConversation.student_id == student.id)
        .first()
    )
    if conversation is None:
        raise NotFoundError("Conversation not found.", code="CONVERSATION_NOT_FOUND")
    db.delete(conversation)
    db.commit()
    return MessageResponse(message="Conversation deleted.")
