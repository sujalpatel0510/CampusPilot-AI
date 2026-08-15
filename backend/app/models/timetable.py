from datetime import time

from sqlalchemy import ForeignKey, Integer, String, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TimetableEntry(Base):
    __tablename__ = "timetable"

    id: Mapped[int] = mapped_column(primary_key=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"), index=True, nullable=False)
    faculty_id: Mapped[int] = mapped_column(ForeignKey("faculty.id", ondelete="CASCADE"), index=True, nullable=False)
    department: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    semester: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    section: Mapped[str] = mapped_column(String(10), index=True, nullable=False)
    day_of_week: Mapped[str] = mapped_column(String(10), index=True, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    room: Mapped[str] = mapped_column(String(50), default="", nullable=False)

    subject: Mapped["Subject"] = relationship(back_populates="timetable_entries")
    faculty: Mapped["Faculty"] = relationship(back_populates="timetable_entries")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<TimetableEntry {self.day_of_week} {self.start_time}-{self.end_time}>"
