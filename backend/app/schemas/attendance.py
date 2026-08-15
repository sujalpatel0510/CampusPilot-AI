from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class AttendanceBase(BaseModel):
    student_id: int
    subject_id: int
    total_classes: int = Field(ge=0)
    attended_classes: int = Field(ge=0)


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceUpdate(BaseModel):
    total_classes: Optional[int] = Field(default=None, ge=0)
    attended_classes: Optional[int] = Field(default=None, ge=0)


class AttendanceOut(ORMModel):
    id: int
    student_id: int
    subject_id: int
    total_classes: int
    attended_classes: int
    updated_at: object

    subject_code: Optional[str] = None
    subject_name: Optional[str] = None


class AttendanceStatusOut(BaseModel):
    total_classes: int
    attended_classes: int
    missed_classes: int
    percentage: float
    status: str  # SAFE | WARNING | CRITICAL
    threshold: float
    can_miss: int
    required_to_maintain: int
