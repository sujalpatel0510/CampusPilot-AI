from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class SubjectBase(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    code: str = Field(min_length=1, max_length=30)
    department: str = Field(min_length=2, max_length=150)
    semester: int = Field(ge=1, le=12)
    credits: int = Field(default=3, ge=1, le=10)


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=200)
    code: Optional[str] = Field(default=None, min_length=1, max_length=30)
    department: Optional[str] = None
    semester: Optional[int] = Field(default=None, ge=1, le=12)
    credits: Optional[int] = Field(default=None, ge=1, le=10)


class SubjectOut(ORMModel):
    id: int
    name: str
    code: str
    department: str
    semester: int
    credits: int


class SubjectWithAttendance(SubjectOut):
    total_classes: int
    attended_classes: int
    percentage: float
