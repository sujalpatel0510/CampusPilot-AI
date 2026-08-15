"""Attendance endpoints.

Students read only their own attendance (via /students/me/attendance). Faculty
and admin can list, create and manage attendance records. Faculty may only
record attendance for subjects they teach.
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import ensure_subject_access, get_student_record, pagination
from app.core.database import get_db
from app.core.exceptions import NotFoundError, ValidationFailedError
from app.core.security import get_current_user, require_faculty_or_admin, require_student
from app.models.attendance import Attendance
from app.models.user import User
from app.schemas.attendance import AttendanceCreate, AttendanceOut, AttendanceUpdate
from app.schemas.common import MessageResponse, Paginated
from app.services.attendance_service import validate_counts
from app.services.notification_service import check_student_alerts

router = APIRouter(prefix="/attendance", tags=["Attendance"])


def _attendance_view(a: Attendance) -> AttendanceOut:
    return AttendanceOut(
        id=a.id,
        student_id=a.student_id,
        subject_id=a.subject_id,
        total_classes=a.total_classes,
        attended_classes=a.attended_classes,
        updated_at=a.updated_at,
        subject_code=a.subject.code if a.subject else "",
        subject_name=a.subject.name if a.subject else "",
    )


@router.get("", response_model=Paginated[AttendanceOut], summary="List attendance (admin/faculty)")
def list_attendance(
    student_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    semester: Optional[int] = None,
    section: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    _: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db),
):
    page, page_size = pagination(page, page_size)
    query = db.query(Attendance)
    if student_id:
        query = query.filter(Attendance.student_id == student_id)
    if subject_id:
        query = query.filter(Attendance.subject_id == subject_id)
    if semester:
        query = query.filter(Attendance.subject.has(semester=semester))
    if section:
        query = query.filter(Attendance.student.has(section=section))
    total = query.count()
    items = query.order_by(Attendance.student_id).offset((page - 1) * page_size).limit(page_size).all()
    return Paginated[AttendanceOut](
        items=[_attendance_view(a) for a in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
    )


@router.get("/{student_id}", response_model=list, summary="One student's attendance (admin/faculty)")
def student_attendance(
    student_id: int,
    _: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Attendance)
        .filter(Attendance.student_id == student_id)
        .order_by(Attendance.subject_id)
        .all()
    )
    return [_attendance_view(a) for a in rows]


@router.post("", response_model=AttendanceOut, summary="Create an attendance record (admin/faculty)")
def create_attendance(
    payload: AttendanceCreate,
    user: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db),
):
    subject = ensure_subject_access(payload.subject_id, user, db)
    existing = (
        db.query(Attendance)
        .filter(
            Attendance.student_id == payload.student_id,
            Attendance.subject_id == payload.subject_id,
        )
        .first()
    )
    if existing:
        raise ValidationFailedError(
            "Attendance record already exists for this student and subject.",
            code="ATTENDANCE_EXISTS",
        )
    validate_counts(payload.total_classes, payload.attended_classes)
    attendance = Attendance(
        student_id=payload.student_id,
        subject_id=payload.subject_id,
        total_classes=payload.total_classes,
        attended_classes=payload.attended_classes,
    )
    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    from app.models.student import Student

    student = db.get(Student, payload.student_id)
    if student:
        check_student_alerts(db, student, student.user)
    return _attendance_view(attendance)


@router.put("/{attendance_id}", response_model=AttendanceOut, summary="Update an attendance record (admin/faculty)")
def update_attendance(
    attendance_id: int,
    payload: AttendanceUpdate,
    user: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db),
):
    attendance = db.get(Attendance, attendance_id)
    if attendance is None:
        raise NotFoundError("Attendance record not found.", code="ATTENDANCE_NOT_FOUND")
    ensure_subject_access(attendance.subject_id, user, db)
    validate_counts(payload.total_classes, payload.attended_classes)
    attendance.total_classes = payload.total_classes
    attendance.attended_classes = payload.attended_classes
    db.commit()
    db.refresh(attendance)
    return _attendance_view(attendance)


@router.delete("/{attendance_id}", response_model=MessageResponse, summary="Delete an attendance record (admin/faculty)")
def delete_attendance(
    attendance_id: int,
    user: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db),
):
    attendance = db.get(Attendance, attendance_id)
    if attendance is None:
        raise NotFoundError("Attendance record not found.", code="ATTENDANCE_NOT_FOUND")
    ensure_subject_access(attendance.subject_id, user, db)
    db.delete(attendance)
    db.commit()
    return MessageResponse(message="Attendance record deleted.")
