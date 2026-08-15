from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import ORMModel


class StudentBase(BaseModel):
    student_id: str = Field(min_length=2, max_length=50)
    college: str = "Default Project"
    department: str = Field(min_length=2, max_length=150)
    course: str = Field(default="", max_length=150)
    semester: int = Field(ge=1, le=12)
    section: str = Field(min_length=1, max_length=10)
    enrollment_year: int = Field(ge=2000, le=2100)


class StudentCreate(StudentBase):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class StudentUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    email: Optional[EmailStr] = None
    student_id: Optional[str] = Field(default=None, min_length=2, max_length=50)
    college: Optional[str] = None
    department: Optional[str] = None
    course: Optional[str] = None
    semester: Optional[int] = Field(default=None, ge=1, le=12)
    section: Optional[str] = None
    enrollment_year: Optional[int] = Field(default=None, ge=2000, le=2100)
    password: Optional[str] = Field(default=None, min_length=6, max_length=128)
    is_active: Optional[bool] = None


class StudentOut(ORMModel):
    id: int
    user_id: int
    student_id: str
    college: str
    department: str
    course: str
    semester: int
    section: str
    enrollment_year: int
    full_name: str
    email: str
    role: str = "student"
    is_active: bool
