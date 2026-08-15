from datetime import date, time
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class ExamBase(BaseModel):
    subject_id: int
    department: str = Field(min_length=2, max_length=150)
    semester: int = Field(ge=1, le=12)
    section: str = Field(min_length=1, max_length=10)
    exam_type: str = Field(min_length=2, max_length=30)
    exam_date: date
    start_time: time
    end_time: time
    room: str = Field(default="", max_length=50)


class ExamCreate(ExamBase):
    pass


class ExamUpdate(BaseModel):
    subject_id: Optional[int] = None
    department: Optional[str] = None
    semester: Optional[int] = Field(default=None, ge=1, le=12)
    section: Optional[str] = None
    exam_type: Optional[str] = None
    exam_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    room: Optional[str] = None


class ExamOut(ORMModel):
    id: int
    subject_id: int
    department: str
    semester: int
    section: str
    exam_type: str
    exam_date: date
    start_time: time
    end_time: time
    room: str

    subject_code: str
    subject_name: str
    days_left: Optional[int] = None
    is_today: bool = False
