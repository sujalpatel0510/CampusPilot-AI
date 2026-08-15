from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

NOTICE_CATEGORIES = ("General", "Exam", "Admission", "Event", "Fee", "Result", "Important")


class Notice(Base):
    __tablename__ = "notices"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    original_file_url: Mapped[str] = mapped_column(String(500), default="", nullable=False)
    extracted_text: Mapped[str] = mapped_column(Text, default="", nullable=False)
    ai_summary: Mapped[str] = mapped_column(Text, default="", nullable=False)
    category: Mapped[str] = mapped_column(String(50), default="General", index=True, nullable=False)
    is_important: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True, nullable=False)

    creator: Mapped["User"] = relationship()

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Notice {self.title}>"
