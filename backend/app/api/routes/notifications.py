"""Notification endpoints (scoped to the authenticated user)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.core.security import get_current_user
from app.models.notification import Notification
from app.models.user import User
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=list, summary="My notifications")
def list_notifications(
    unread_only: bool = False,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Notification).filter(Notification.user_id == user.id)
    if unread_only:
        query = query.filter(Notification.is_read.is_(False))
    return query.order_by(Notification.created_at.desc()).limit(100).all()


@router.patch("/{notification_id}/read", response_model=MessageResponse, summary="Mark a notification read")
def mark_read(
    notification_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user.id)
        .first()
    )
    if notification is None:
        raise NotFoundError("Notification not found.", code="NOTIFICATION_NOT_FOUND")
    notification.is_read = True
    db.commit()
    return MessageResponse(message="Notification marked as read.")


@router.post("/read-all", response_model=MessageResponse, summary="Mark all my notifications read")
def mark_all_read(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(Notification).filter(Notification.user_id == user.id, Notification.is_read.is_(False)).update(
        {Notification.is_read: True}
    )
    db.commit()
    return MessageResponse(message="All notifications marked as read.")
