"""Exam endpoints (read: any authenticated user, write: admin/faculty)."""

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import pagination
from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.core.security import get_current_user, require_faculty_or_admin
from app.models.exam import Exam
from app.models.user import User
from app.schemas.common import MessageResponse, Paginated
from app.schemas.exam import ExamCreate, ExamOut, ExamUpdate
from app.services.notification_service import notify_exam_scheduled

router = APIRouter(prefix="/exams", tags=["Exams"])


@router.get("", response_model=Paginated[ExamOut], summary="List exams")
def list_exams(
    subject_id: Optional[int] = None,
    department: Optional[str] = None,
    semester: Optional[int] = None,
    section: Optional[str] = None,
    exam_type: Optional[str] = None,
    upcoming_only: bool = False,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    page, page_size = pagination(page, page_size)
    query = db.query(Exam)
    if subject_id:
        query = query.filter(Exam.subject_id == subject_id)
    if department:
        query = query.filter(Exam.department == department)
    if semester:
        query = query.filter(Exam.semester == semester)
    if section:
        query = query.filter(Exam.section == section)
    if exam_type:
        query = query.filter(Exam.exam_type == exam_type)
    if upcoming_only:
        query = query.filter(Exam.exam_date >= date.today())
    total = query.count()
    items = query.order_by(Exam.exam_date).offset((page - 1) * page_size).limit(page_size).all()
    return Paginated[ExamOut](
        items=[ExamOut.model_validate(e) for e in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
    )


@router.get("/{exam_id}", response_model=ExamOut, summary="Get an exam")
def get_exam(
    exam_id: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exam = db.get(Exam, exam_id)
    if exam is None:
        raise NotFoundError("Exam not found.", code="EXAM_NOT_FOUND")
    return exam


@router.post("", response_model=ExamOut, summary="Create an exam (admin/faculty)")
def create_exam(
    payload: ExamCreate,
    _: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db),
):
    exam = Exam(**payload.model_dump())
    db.add(exam)
    db.commit()
    db.refresh(exam)
    notify_exam_scheduled(db, exam)
    return exam


@router.put("/{exam_id}", response_model=ExamOut, summary="Update an exam (admin/faculty)")
def update_exam(
    exam_id: int,
    payload: ExamUpdate,
    _: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db),
):
    exam = db.get(Exam, exam_id)
    if exam is None:
        raise NotFoundError("Exam not found.", code="EXAM_NOT_FOUND")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(exam, field, value)
    db.commit()
    db.refresh(exam)
    return exam


@router.delete("/{exam_id}", response_model=MessageResponse, summary="Delete an exam (admin/faculty)")
def delete_exam(
    exam_id: int,
    _: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db),
):
    exam = db.get(Exam, exam_id)
    if exam is None:
        raise NotFoundError("Exam not found.", code="EXAM_NOT_FOUND")
    db.delete(exam)
    db.commit()
    return MessageResponse(message="Exam deleted.")
