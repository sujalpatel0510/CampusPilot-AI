from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

ASSIGNMENT_PRIORITIES = ("low", "medium", "high")


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[int] = mapped_column(primary_key=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"), index=True, nullable=False)
    faculty_id: Mapped[int] = mapped_column(ForeignKey("faculty.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(String(2000), default="", nullable=False)
    due_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    priority: Mapped[str] = mapped_column(String(10), default="medium", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    subject: Mapped["Subject"] = relationship(back_populates="assignments")
    faculty: Mapped["Faculty"] = relationship(back_populates="assignments")
    submissions: Mapped[list["AssignmentSubmission"]] = relationship(back_populates="assignment", cascade="all, delete-orphan")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Assignment {self.title} due={self.due_date}>"


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id: Mapped[int] = mapped_column(primary_key=True)
    assignment_id: Mapped[int] = mapped_column(
        ForeignKey("assignments.id", ondelete="CASCADE"), index=True, nullable=False
    )
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="submitted", nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    file_url: Mapped[str] = mapped_column(String(500), default="", nullable=False)

    assignment: Mapped["Assignment"] = relationship(back_populates="submissions")
    student: Mapped["Student"] = relationship(back_populates="submissions")
