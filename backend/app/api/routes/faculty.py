"""Faculty endpoints.

Faculty can see their own profile, the subjects they teach (derived from the
timetable) and the students enrolled in those subjects. All data is scoped to
the authenticated faculty member.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_faculty_record, get_student_record, pagination
from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.core.logging import get_logger
from app.core.security import get_current_user, require_admin, require_faculty
from app.models.attendance import Attendance
from app.models.faculty import Faculty
from app.models.student import Student, StudentSubject
from app.models.subject import Subject
from app.models.timetable import TimetableEntry
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.faculty import FacultyCreate, FacultyOut, FacultyUpdate
from app.services.attendance_service import percentage_for, status_for
from app.services.auth_service import hash_password, register_user

logger = get_logger("faculty")

router = APIRouter(prefix="/faculty", tags=["Faculty"])


def _faculty_out(faculty: Faculty) -> dict:
    return {
        "id": faculty.id,
        "user_id": faculty.user_id,
        "employee_id": faculty.employee_id,
        "department": faculty.department,
        "full_name": faculty.user.full_name,
        "email": faculty.user.email,
        "role": faculty.user.role,
        "is_active": faculty.user.is_active,
    }


@router.get("/me", response_model=dict, summary="My faculty profile")
def my_profile(
    user: User = Depends(require_faculty),
    db: Session = Depends(get_db),
):
    faculty = get_faculty_record(db, user)
    return _faculty_out(faculty)


@router.get("/me/subjects", response_model=List[dict], summary="Subjects I teach")
def my_subjects(
    user: User = Depends(require_faculty),
    db: Session = Depends(get_db),
):
    faculty = get_faculty_record(db, user)
    subject_ids = {
        e.subject_id
        for e in db.query(TimetableEntry).filter(TimetableEntry.faculty_id == faculty.id).all()
    }
    subjects = db.query(Subject).filter(Subject.id.in_(subject_ids)).all() if subject_ids else []
    return [
        {
            "id": s.id,
            "name": s.name,
            "code": s.code,
            "department": s.department,
            "semester": s.semester,
            "credits": s.credits,
        }
        for s in subjects
    ]


@router.get("/me/subjects/{subject_id}/students", response_model=List[dict], summary="Students enrolled in a subject I teach")
def subject_students(
    subject_id: int,
    user: User = Depends(require_faculty),
    db: Session = Depends(get_db),
):
    faculty = get_faculty_record(db, user)
    teaches = (
        db.query(TimetableEntry)
        .filter(TimetableEntry.subject_id == subject_id, TimetableEntry.faculty_id == faculty.id)
        .first()
    )
    if teaches is None:
        raise NotFoundError("You do not teach this subject.", code="SUBJECT_ACCESS_DENIED")

    links = (
        db.query(StudentSubject)
        .filter(StudentSubject.subject_id == subject_id)
        .all()
    )
    result = []
    for link in links:
        student = db.get(Student, link.student_id)
        if not student:
            continue
        attendance = (
            db.query(Attendance)
            .filter(Attendance.student_id == student.id, Attendance.subject_id == subject_id)
            .first()
        )
        percentage = (
            percentage_for(attendance.attended_classes, attendance.total_classes)
            if attendance and attendance.total_classes
            else 0.0
        )
        result.append(
            {
                "id": student.id,
                "student_id": student.student_id,
                "full_name": student.user.full_name,
                "email": student.user.email,
                "department": student.department,
                "semester": student.semester,
                "section": student.section,
                "attendance_id": attendance.id if attendance else None,
                "total_classes": attendance.total_classes if attendance else 0,
                "attended_classes": attendance.attended_classes if attendance else 0,
                "percentage": round(percentage, 2),
                "status": status_for(percentage) if attendance else "NO_RECORD",
            }
        )
    return result


# --- Admin management --------------------------------------------------------

@router.get("", response_model=List[dict], summary="List faculty (admin)")
def list_faculty(
    search: Optional[str] = None,
    department: Optional[str] = None,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Faculty)
    if search:
        like = f"%{search.strip()}%"
        query = query.join(User).filter(Faculty.employee_id.ilike(like) | User.full_name.ilike(like))
    if department:
        query = query.filter(Faculty.department == department)
    return [_faculty_out(f) for f in query.order_by(Faculty.employee_id).all()]


@router.get("/{employee_id}", response_model=dict, summary="Get a faculty member (admin)")
def get_faculty(
    employee_id: str,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    faculty = db.query(Faculty).filter(Faculty.employee_id == employee_id).first()
    if faculty is None:
        raise NotFoundError("Faculty not found.", code="FACULTY_NOT_FOUND")
    return _faculty_out(faculty)


@router.post("", response_model=FacultyOut, summary="Create a faculty member (admin)")
def create_faculty(
    payload: FacultyCreate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    from app.schemas.auth import RegisterRequest

    register_user(
        db,
        RegisterRequest(
            full_name=payload.full_name,
            email=payload.email,
            password=payload.password,
            employee_id=payload.employee_id,
            department=payload.department,
        ),
        role="faculty",
    )
    faculty = db.query(Faculty).filter(Faculty.employee_id == payload.employee_id).first()
    return _faculty_out(faculty)


@router.patch("/{employee_id}", response_model=FacultyOut, summary="Update a faculty member (admin)")
def update_faculty(
    employee_id: str,
    payload: FacultyUpdate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    faculty = db.query(Faculty).filter(Faculty.employee_id == employee_id).first()
    if faculty is None:
        raise NotFoundError("Faculty not found.", code="FACULTY_NOT_FOUND")
    user = faculty.user
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.email is not None:
        user.email = str(payload.email).lower()
    if payload.password is not None:
        user.password_hash = hash_password(payload.password)
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.employee_id is not None:
        faculty.employee_id = payload.employee_id
    if payload.department is not None:
        faculty.department = payload.department
    db.commit()
    db.refresh(faculty)
    return _faculty_out(faculty)


@router.delete("/{employee_id}", response_model=MessageResponse, summary="Delete a faculty member (admin)")
def delete_faculty(
    employee_id: str,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    faculty = db.query(Faculty).filter(Faculty.employee_id == employee_id).first()
    if faculty is None:
        raise NotFoundError("Faculty not found.", code="FACULTY_NOT_FOUND")
    db.delete(faculty.user)
    db.commit()
    return MessageResponse(message="Faculty deleted.")
