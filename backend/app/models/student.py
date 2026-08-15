from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    student_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    college: Mapped[str] = mapped_column(String(200), default="", nullable=False)
    department: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    course: Mapped[str] = mapped_column(String(150), default="", nullable=False)
    semester: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    section: Mapped[str] = mapped_column(String(10), index=True, nullable=False)
    enrollment_year: Mapped[int] = mapped_column(Integer, nullable=False, default=2023)

    user: Mapped["User"] = relationship(back_populates="student")
    subjects: Mapped[list["StudentSubject"]] = relationship(
        back_populates="student", cascade="all, delete-orphan"
    )
    attendance: Mapped[list["Attendance"]] = relationship(back_populates="student", cascade="all, delete-orphan")
    study_plans: Mapped[list["StudyPlan"]] = relationship(back_populates="student", cascade="all, delete-orphan")
    conversations: Mapped[list["AiConversation"]] = relationship(back_populates="student", cascade="all, delete-orphan")
    submissions: Mapped[list["AssignmentSubmission"]] = relationship(back_populates="student", cascade="all, delete-orphan")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Student id={self.student_id}>"


class StudentSubject(Base):
    __tablename__ = "student_subjects"
    __table_args__ = (UniqueConstraint("student_id", "subject_id", name="uq_student_subject"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), index=True, nullable=False)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"), index=True, nullable=False)

    student: Mapped["Student"] = relationship(back_populates="subjects")
    subject: Mapped["Subject"] = relationship(back_populates="student_links")
