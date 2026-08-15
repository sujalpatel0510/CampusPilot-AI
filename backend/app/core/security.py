"""Security helpers: password hashing, JWT tokens and RBAC dependencies."""

import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import (
    ForbiddenError,
    UnauthorizedError,
)
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login/form")


# --- Password hashing -----------------------------------------------------

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


# --- JWT -------------------------------------------------------------------

def _create_token(subject: str, token_type: str, expires_delta: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(subject),
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(subject: str) -> str:
    return _create_token(subject, "access", timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))


def create_refresh_token(subject: str) -> str:
    return _create_token(subject, "refresh", timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))


def decode_token(token: str, expected_type: Optional[str] = None) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except jwt.ExpiredSignatureError as exc:
        raise UnauthorizedError("Token has expired.", code="TOKEN_EXPIRED") from exc
    except jwt.InvalidTokenError as exc:
        raise UnauthorizedError("Invalid token.", code="INVALID_TOKEN") from exc
    if expected_type and payload.get("type") != expected_type:
        raise UnauthorizedError("Invalid token type.", code="INVALID_TOKEN")
    return payload


# --- Dependencies -----------------------------------------------------------

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_token(token, expected_type="access")
    user = db.query(User).filter(User.id == int(payload.get("sub"))).first()
    if user is None:
        raise UnauthorizedError("User account not found.", code="USER_NOT_FOUND")
    if not user.is_active:
        raise UnauthorizedError("This account is deactivated.", code="ACCOUNT_INACTIVE")
    return user


def require_student(user: User = Depends(get_current_user)) -> User:
    if user.role != "student":
        raise ForbiddenError("This endpoint is only available to students.", code="STUDENT_REQUIRED")
    return user


def require_faculty(user: User = Depends(get_current_user)) -> User:
    if user.role != "faculty":
        raise ForbiddenError("This endpoint is only available to faculty.", code="FACULTY_REQUIRED")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise ForbiddenError("This endpoint is only available to administrators.", code="ADMIN_REQUIRED")
    return user


def require_faculty_or_admin(user: User = Depends(get_current_user)) -> User:
    if user.role not in ("faculty", "admin"):
        raise ForbiddenError("Administrator or faculty access required.", code="ROLE_REQUIRED")
    return user
