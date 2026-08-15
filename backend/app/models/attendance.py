from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (
        UniqueConstraint("student_id", "subject_id", name="uq_attendance_student_subject"),
        CheckConstraint("attended_classes <= total_classes", name="ck_attendance_attended_le_total"),
        CheckConstraint("total_classes >= 0", name="ck_attendance_total_ge_zero"),
        CheckConstraint("attended_classes >= 0", name="ck_attendance_attended_ge_zero"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), index=True, nullable=False)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"), index=True, nullable=False)
    total_classes: Mapped[int] = mapped_column(Integer, nullable=False)
    attended_classes: Mapped[int] = mapped_column(Integer, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    student: Mapped["Student"] = relationship(back_populates="attendance")
    subject: Mapped["Subject"] = relationship(back_populates="attendance")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Attendance student={self.student_id} subject={self.subject_id}>"
