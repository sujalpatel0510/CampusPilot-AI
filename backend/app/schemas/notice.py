from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class NoticeBase(BaseModel):
    title: str = Field(min_length=2, max_length=300)
    extracted_text: str = Field(default="", max_length=20000)
    ai_summary: str = Field(default="", max_length=20000)
    category: str = "General"
    is_important: bool = False


class NoticeCreate(NoticeBase):
    pass


class NoticeUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=300)
    extracted_text: Optional[str] = None
    ai_summary: Optional[str] = None
    category: Optional[str] = None
    is_important: Optional[bool] = None


class NoticeOut(ORMModel):
    id: int
    title: str
    original_file_url: str
    extracted_text: str
    ai_summary: str
    category: str
    is_important: bool
    created_by: Optional[int]
    created_at: datetime


class NoticeUploadResult(BaseModel):
    notice: NoticeOut
    file: dict
    ocr_success: bool
    ocr_error: Optional[str] = None
    ai_summary: Optional[str] = None
