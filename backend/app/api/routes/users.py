"""User management (admin only)."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import pagination
from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.core.security import require_admin
from app.models.user import User
from app.schemas.common import MessageResponse, Paginated
from app.schemas.user import UserOut, UserUpdate
from app.services.auth_service import hash_password

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "",
    response_model=Paginated[UserOut],
    summary="List users",
    description="Admin only. Supports search, pagination and role filtering.",
)
def list_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    page, page_size = pagination(page, page_size)
    query = db.query(User)
    if search:
        like = f"%{search.strip()}%"
        query = query.filter(User.full_name.ilike(like) | User.email.ilike(like))
    if role:
        query = query.filter(User.role == role)
    total = query.count()
    items = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return Paginated[UserOut](
        items=[UserOut.model_validate(u) for u in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
    )


@router.get("/{user_id}", response_model=UserOut, summary="Get a user")
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = db.get(User, user_id)
    if user is None:
        raise NotFoundError("User not found.", code="USER_NOT_FOUND")
    return user


@router.patch("/{user_id}", response_model=UserOut, summary="Update a user")
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = db.get(User, user_id)
    if user is None:
        raise NotFoundError("User not found.", code="USER_NOT_FOUND")
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.password is not None:
        user.password_hash = hash_password(payload.password)
    if payload.is_active is not None:
        user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", response_model=MessageResponse, summary="Deactivate a user")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = db.get(User, user_id)
    if user is None:
        raise NotFoundError("User not found.", code="USER_NOT_FOUND")
    user.is_active = False
    db.commit()
    return MessageResponse(message="User deactivated.")
