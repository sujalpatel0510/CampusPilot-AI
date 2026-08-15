"""Subject endpoints (read: any authenticated user, write: admin)."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import pagination
from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.core.security import get_current_user, require_admin
from app.models.subject import Subject
from app.models.user import User
from app.schemas.common import MessageResponse, Paginated
from app.schemas.subject import SubjectCreate, SubjectOut, SubjectUpdate

router = APIRouter(prefix="/subjects", tags=["Subjects"])


@router.get("", response_model=Paginated[SubjectOut], summary="List subjects")
def list_subjects(
    search: Optional[str] = None,
    department: Optional[str] = None,
    semester: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    page, page_size = pagination(page, page_size)
    query = db.query(Subject)
    if search:
        like = f"%{search.strip()}%"
        query = query.filter(Subject.name.ilike(like) | Subject.code.ilike(like))
    if department:
        query = query.filter(Subject.department == department)
    if semester:
        query = query.filter(Subject.semester == semester)
    total = query.count()
    items = query.order_by(Subject.code).offset((page - 1) * page_size).limit(page_size).all()
    return Paginated[SubjectOut](
        items=[SubjectOut.model_validate(s) for s in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
    )


@router.get("/{subject_id}", response_model=SubjectOut, summary="Get a subject")
def get_subject(
    subject_id: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subject = db.get(Subject, subject_id)
    if subject is None:
        raise NotFoundError("Subject not found.", code="SUBJECT_NOT_FOUND")
    return subject


@router.post("", response_model=SubjectOut, summary="Create a subject (admin)")
def create_subject(
    payload: SubjectCreate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    subject = Subject(**payload.model_dump())
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.patch("/{subject_id}", response_model=SubjectOut, summary="Update a subject (admin)")
def update_subject(
    subject_id: int,
    payload: SubjectUpdate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    subject = db.get(Subject, subject_id)
    if subject is None:
        raise NotFoundError("Subject not found.", code="SUBJECT_NOT_FOUND")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(subject, field, value)
    db.commit()
    db.refresh(subject)
    return subject


@router.delete("/{subject_id}", response_model=MessageResponse, summary="Delete a subject (admin)")
def delete_subject(
    subject_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    subject = db.get(Subject, subject_id)
    if subject is None:
        raise NotFoundError("Subject not found.", code="SUBJECT_NOT_FOUND")
    db.delete(subject)
    db.commit()
    return MessageResponse(message="Subject deleted.")
