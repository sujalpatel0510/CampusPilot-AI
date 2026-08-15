from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class StudyMaterialBase(BaseModel):
    subject_id: int
    title: str = Field(min_length=2, max_length=200)
    description: str = Field(default="", max_length=1000)
    file_url: str = Field(min_length=1, max_length=500)
    file_type: str = Field(default="pdf", max_length=20)
    file_size: int = Field(default=0, ge=0)


class StudyMaterialCreate(StudyMaterialBase):
    pass


class StudyMaterialUpdate(BaseModel):
    subject_id: Optional[int] = None
    title: Optional[str] = Field(default=None, min_length=2, max_length=200)
    description: Optional[str] = None
    file_url: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = Field(default=None, ge=0)


class StudyMaterialOut(ORMModel):
    id: int
    subject_id: int
    uploaded_by: Optional[int]
    title: str
    description: str
    file_url: str
    file_type: str
    file_size: int
    created_at: datetime

    subject_code: str
    subject_name: str
