from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

MESSAGE_ROLES = ("user", "assistant")


class AiConversation(Base):
    __tablename__ = "ai_conversations"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), default="New conversation", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    student: Mapped["Student"] = relationship(back_populates="conversations")
    messages: Mapped[list["AiMessage"]] = relationship(
        back_populates="conversation", cascade="all, delete-orphan", order_by="AiMessage.created_at"
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<AiConversation {self.title}>"


class AiMessage(Base):
    __tablename__ = "ai_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    conversation_id: Mapped[int] = mapped_column(
        ForeignKey("ai_conversations.id", ondelete="CASCADE"), index=True, nullable=False
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    conversation: Mapped["AiConversation"] = relationship(back_populates="messages")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<AiMessage {self.role}>"
