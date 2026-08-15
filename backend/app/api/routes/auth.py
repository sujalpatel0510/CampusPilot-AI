"""Authentication endpoints."""

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.logging import get_logger
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.auth import (
    AuthUserOut,
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)
from app.services.auth_service import (
    authenticate_user,
    get_profile,
    issue_tokens,
    refresh_access_token,
    register_user,
)

logger = get_logger("auth")

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=TokenResponse,
    summary="Register a new account",
    description="Creates a student account (with a student profile) and returns JWT tokens.",
)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
):
    user = register_user(db, payload, role="student")
    logger.info("User registered", extra={"user_id": user.id, "role": user.role})
    return issue_tokens(user.id)


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Log in",
    description="Accepts JSON credentials and returns JWT tokens plus the user profile.",
)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    user = authenticate_user(db, str(payload.email), payload.password)
    tokens = issue_tokens(user.id)
    logger.info("User logged in", extra={"user_id": user.id})
    return {**tokens, "user": get_profile(db, user)}


@router.post(
    "/login/form",
    response_model=LoginResponse,
    summary="Log in (form)",
    description="Form-encoded credentials. Used by the Swagger 'Authorize' button.",
    include_in_schema=False,
)
def login_form(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = authenticate_user(db, form.username, form.password)
    tokens = issue_tokens(user.id)
    return {**tokens, "user": get_profile(db, user)}


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh an access token",
    description="Exchange a valid refresh token for a new access token.",
)
def refresh(payload: RefreshRequest):
    return refresh_access_token(payload.refresh_token)


@router.get(
    "/me",
    response_model=AuthUserOut,
    summary="Current user profile",
    description="Returns the authenticated user plus their role-specific profile.",
)
def me(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_profile(db, user)
