from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import ORMModel
from app.schemas.user import UserOut


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    # Optional student profile fields, filled when a student self-registers.
    student_id: Optional[str] = None
    college: Optional[str] = None
    department: Optional[str] = None
    course: Optional[str] = None
    semester: Optional[int] = Field(default=None, ge=1, le=12)
    section: Optional[str] = None
    enrollment_year: Optional[int] = Field(default=None, ge=2000, le=2100)
    # Optional faculty profile field, filled when a faculty member is created.
    employee_id: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class AuthUserOut(ORMModel):
    model_config = ORMModel.model_config
    user: UserOut
    student_id: Optional[str] = None
    employee_id: Optional[str] = None


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: AuthUserOut
