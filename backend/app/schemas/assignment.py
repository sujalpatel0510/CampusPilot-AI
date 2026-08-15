from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class AssignmentBase(BaseModel):
    subject_id: int
    title: str = Field(min_length=2, max_length=200)
    description: str = Field(default="", max_length=2000)
    due_date: date
    priority: str = "medium"


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=200)
    description: Optional[str] = None
    due_date: Optional[date] = None
    priority: Optional[str] = None


class AssignmentOut(ORMModel):
    id: int
    subject_id: int
    faculty_id: int
    title: str
    description: str
    due_date: date
    priority: str
    created_at: datetime

    subject_code: Optional[str] = None
    subject_name: Optional[str] = None
    status: Optional[str] = None  # pending | overdue | completed


class AssignmentSubmissionCreate(BaseModel):
    file_url: Optional[str] = Field(default=None, max_length=500)
    status: str = "submitted"
