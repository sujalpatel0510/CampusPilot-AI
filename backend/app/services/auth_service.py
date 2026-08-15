"""Authentication services: registration, login, token refresh.

Passwords are hashed with bcrypt and never logged. JWT access + refresh
tokens are issued here.
"""

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.exceptions import (
    ConflictError,
    NotFoundError,
    UnauthorizedError,
    ValidationFailedError,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.faculty import Faculty
from app.models.student import Student
from app.models.user import ROLE_ADMIN, ROLE_FACULTY, ROLE_STUDENT, User
from app.schemas.auth import RegisterRequest


def register_user(db: Session, data: RegisterRequest, role: str = ROLE_STUDENT) -> User:
    """Create a user account, optionally with a student profile."""
    existing = db.query(User).filter(User.email == str(data.email).lower()).first()
    if existing:
        raise ConflictError("An account with this email already exists.", code="EMAIL_EXISTS")

    user = User(
        full_name=data.full_name.strip(),
        email=str(data.email).lower(),
        password_hash=hash_password(data.password),
        role=role,
        is_active=True,
    )
    db.add(user)
    db.flush()

    if role == ROLE_STUDENT:
        student_id = (data.student_id or "").strip()
        if not student_id:
            raise ValidationFailedError("student_id is required to create a student account.", code="STUDENT_ID_REQUIRED")
        student = Student(
            user_id=user.id,
            student_id=student_id,
            college=data.college if hasattr(data, "college") else "Default Project",
            department=(data.department or "General").strip(),
            course=(data.course or "").strip(),
            semester=data.semester or 1,
            section=(data.section or "A").strip(),
            enrollment_year=data.enrollment_year or datetime.now(timezone.utc).year,
        )
        db.add(student)

    if role == ROLE_FACULTY:
        if not getattr(data, "employee_id", None):
            raise ValidationFailedError("employee_id is required to create a faculty account.", code="EMPLOYEE_ID_REQUIRED")
        db.add(Faculty(user_id=user.id, employee_id=data.employee_id, department=data.department or "General"))

    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.query(User).filter(User.email == email.lower()).first()
    if user is None or not verify_password(password, user.password_hash):
        raise UnauthorizedError("Invalid email or password.", code="INVALID_CREDENTIALS")
    if not user.is_active:
        raise UnauthorizedError("This account has been deactivated.", code="ACCOUNT_INACTIVE")
    return user


def issue_tokens(user_id: int) -> dict:
    return {
        "access_token": create_access_token(str(user_id)),
        "refresh_token": create_refresh_token(str(user_id)),
        "token_type": "bearer",
    }


def refresh_access_token(refresh_token: str) -> dict:
    payload = decode_token(refresh_token, expected_type="refresh")
    return {
        "access_token": create_access_token(str(payload["sub"])),
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


def get_profile(db: Session, user: User) -> dict:
    """Return the role-specific profile for a user (used by /auth/me)."""
    profile: dict = {"user": {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at,
    }}
    if user.role == ROLE_STUDENT:
        student = db.query(Student).filter(Student.user_id == user.id).first()
        profile["student_id"] = student.student_id if student else None
    elif user.role == ROLE_FACULTY:
        faculty = db.query(Faculty).filter(Faculty.user_id == user.id).first()
        profile["employee_id"] = faculty.employee_id if faculty else None
    return profile


def get_student_by_user(db: Session, user: User) -> Student:
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if student is None:
        raise NotFoundError("Student profile not found.", code="STUDENT_NOT_FOUND")
    return student


def get_faculty_by_user(db: Session, user: User) -> Faculty:
    faculty = db.query(Faculty).filter(Faculty.user_id == user.id).first()
    if faculty is None:
        raise NotFoundError("Faculty profile not found.", code="FACULTY_NOT_FOUND")
    return faculty


def _ensure_admin_safe(db: Session, user_id: int) -> None:
    user = db.query(User).get(user_id)
    if user is None:
        raise NotFoundError("User not found.", code="USER_NOT_FOUND")
