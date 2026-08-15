from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import ORMModel


class FacultyBase(BaseModel):
    employee_id: str = Field(min_length=2, max_length=50)
    department: str = Field(min_length=2, max_length=150)


class FacultyCreate(FacultyBase):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class FacultyUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    email: Optional[EmailStr] = None
    employee_id: Optional[str] = Field(default=None, min_length=2, max_length=50)
    department: Optional[str] = None
    password: Optional[str] = Field(default=None, min_length=6, max_length=128)
    is_active: Optional[bool] = None


class FacultyOut(ORMModel):
    id: int
    user_id: int
    employee_id: str
    department: str
    full_name: str
    email: str
    role: str = "faculty"
    is_active: bool
