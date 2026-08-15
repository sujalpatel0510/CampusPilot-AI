from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Faculty(Base):
    __tablename__ = "faculty"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    employee_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    department: Mapped[str] = mapped_column(String(150), index=True, nullable=False)

    user: Mapped["User"] = relationship(back_populates="faculty")
    timetable_entries: Mapped[list["TimetableEntry"]] = relationship(back_populates="faculty")
    assignments: Mapped[list["Assignment"]] = relationship(back_populates="faculty")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Faculty employee_id={self.employee_id}>"
