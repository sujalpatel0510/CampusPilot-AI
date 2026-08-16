from datetime import time
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel

WEEK_DAYS = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")


class TimetableBase(BaseModel):
    subject_id: int
    faculty_id: int
    department: str = Field(min_length=2, max_length=150)
    semester: int = Field(ge=1, le=12)
    section: str = Field(min_length=1, max_length=10)
    day_of_week: str
    start_time: time
    end_time: time
    room: str = Field(default="", max_length=50)


class TimetableCreate(TimetableBase):
    pass


class TimetableUpdate(BaseModel):
    subject_id: Optional[int] = None
    faculty_id: Optional[int] = None
    department: Optional[str] = None
    semester: Optional[int] = Field(default=None, ge=1, le=12)
    section: Optional[str] = None
    day_of_week: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    room: Optional[str] = None


class TimetableOut(ORMModel):
    id: int
    subject_id: int
    faculty_id: int
    department: str
    semester: int
    section: str
    day_of_week: str
    start_time: time
    end_time: time
    room: str

    subject_code: str
    subject_name: str
    faculty_name: str


class TimetableDayOut(BaseModel):
    day: str
    date: str
    entries: list[TimetableOut]
