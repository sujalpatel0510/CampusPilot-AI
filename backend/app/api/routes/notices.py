"""Notice endpoints.

Uploading a file (PDF/image) extracts text via OCR and produces an AI summary
when the provider is available; otherwise the raw text is kept.
"""

from typing import Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import NotFoundError, ValidationFailedError
from app.core.logging import get_logger
from app.core.security import get_current_user, require_faculty_or_admin
from app.models.notice import Notice
from app.models.user import User
from app.schemas.common import MessageResponse, Paginated
from app.schemas.notice import NoticeCreate, NoticeOut, NoticeUpdate, NoticeUploadResult
from app.services.ai_service import summarize_text
from app.services.notification_service import notify_notice_created
from app.services.ocr_service import extract_text
from app.utils.file_parser import save_upload

logger = get_logger("notices")

router = APIRouter(prefix="/notices", tags=["Notices"])


@router.get("", response_model=Paginated[NoticeOut], summary="List notices")
def list_notices(
    category: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)
    query = db.query(Notice)
    if category:
        query = query.filter(Notice.category == category)
    if search:
        like = f"%{search.strip()}%"
        query = query.filter(Notice.title.ilike(like) | Notice.extracted_text.ilike(like))
    total = query.count()
    items = (
        query.order_by(Notice.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return Paginated[NoticeOut](
        items=[NoticeOut.model_validate(n) for n in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
    )


@router.get("/{notice_id}", response_model=NoticeOut, summary="Get a notice")
def get_notice(
    notice_id: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notice = db.get(Notice, notice_id)
    if notice is None:
        raise NotFoundError("Notice not found.", code="NOTICE_NOT_FOUND")
    return notice


@router.post(
    "/upload",
    response_model=NoticeUploadResult,
    summary="Upload a notice document",
    description="Accepts a PDF or image. Text is extracted (OCR) and optionally summarized by the AI assistant.",
)
async def upload_notice(
    file: UploadFile = File(...),
    category: str = Form("general"),
    title: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    user: User = Depends(require_faculty_or_admin),
):
    raw = await file.read()
    if settings.MAX_UPLOAD_SIZE and len(raw) > settings.MAX_UPLOAD_SIZE:
        raise ValidationFailedError("File exceeds the maximum allowed size.", code="FILE_TOO_LARGE")

    saved = save_upload(raw, file.filename or "notice", settings.UPLOAD_DIR)
    text, ok, error = extract_text(raw, file.filename or "")
    content = text or ""
    ai_summary = None
    if ok and content.strip():
        ai_summary = summarize_text(content)

    notice = Notice(
        title=title or saved["filename"],
        extracted_text=content,
        category=category,
        is_important=False,
        original_file_url=saved["file_url"],
        ai_summary=ai_summary or "",
        created_by=user.id,
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)
    notify_notice_created(db, notice)
    logger.info("Notice uploaded", extra={"notice_id": notice.id, "user_id": user.id})

    return {
        "notice": NoticeOut.model_validate(notice),
        "file": saved,
        "ocr_success": ok,
        "ocr_error": error,
        "ai_summary": ai_summary,
    }


@router.post("", response_model=NoticeOut, summary="Create a notice")
def create_notice(
    payload: NoticeCreate,
    user: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db),
):
    notice = Notice(**payload.model_dump(), created_by=user.id)
    db.add(notice)
    db.commit()
    db.refresh(notice)
    notify_notice_created(db, notice)
    return notice


@router.put("/{notice_id}", response_model=NoticeOut, summary="Update a notice")
def update_notice(
    notice_id: int,
    payload: NoticeUpdate,
    _: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db),
):
    notice = db.get(Notice, notice_id)
    if notice is None:
        raise NotFoundError("Notice not found.", code="NOTICE_NOT_FOUND")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(notice, field, value)
    db.commit()
    db.refresh(notice)
    return notice


@router.delete("/{notice_id}", response_model=MessageResponse, summary="Delete a notice")
def delete_notice(
    notice_id: int,
    _: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db),
):
    notice = db.get(Notice, notice_id)
    if notice is None:
        raise NotFoundError("Notice not found.", code="NOTICE_NOT_FOUND")
    db.delete(notice)
    db.commit()
    return MessageResponse(message="Notice deleted.")
