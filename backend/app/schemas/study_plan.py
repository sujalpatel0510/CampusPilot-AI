from datetime import date, datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class StudyPlanGenerateRequest(BaseModel):
    available_hours: int = Field(default=3, ge=1, le=12)
    exam_dates: Dict[str, date] = Field(default_factory=dict)
    subjects: List[int] = Field(default_factory=list)
    weak_subjects: List[int] = Field(default_factory=list)
    preferred_time: str = Field(default="evening", pattern="^(morning|evening|night)$")


class StudyPlanOut(ORMModel):
    id: int
    student_id: int
    title: str
    start_date: date
    end_date: date
    plan_data: Dict[str, Any]
    created_at: datetime
