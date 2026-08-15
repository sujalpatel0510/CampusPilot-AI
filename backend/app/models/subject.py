from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    department: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    semester: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    credits: Mapped[int] = mapped_column(Integer, default=3, nullable=False)

    student_links: Mapped[list["StudentSubject"]] = relationship(back_populates="subject", cascade="all, delete-orphan")
    attendance: Mapped[list["Attendance"]] = relationship(back_populates="subject", cascade="all, delete-orphan")
    timetable_entries: Mapped[list["TimetableEntry"]] = relationship(back_populates="subject", cascade="all, delete-orphan")
    assignments: Mapped[list["Assignment"]] = relationship(back_populates="subject", cascade="all, delete-orphan")
    exams: Mapped[list["Exam"]] = relationship(back_populates="subject", cascade="all, delete-orphan")
    materials: Mapped[list["StudyMaterial"]] = relationship(back_populates="subject", cascade="all, delete-orphan")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Subject code={self.code} name={self.name}>"
