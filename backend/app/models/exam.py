from datetime import date, time

from sqlalchemy import Date, ForeignKey, Integer, String, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

EXAM_TYPES = ("Internal", "Midterm", "End Sem", "Practical", "Quiz")


class Exam(Base):
    __tablename__ = "exams"

    id: Mapped[int] = mapped_column(primary_key=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"), index=True, nullable=False)
    department: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    semester: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    section: Mapped[str] = mapped_column(String(10), index=True, nullable=False)
    exam_type: Mapped[str] = mapped_column(String(30), nullable=False)
    exam_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    room: Mapped[str] = mapped_column(String(50), default="", nullable=False)

    subject: Mapped["Subject"] = relationship(back_populates="exams")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Exam {self.exam_type} {self.exam_date}>"
