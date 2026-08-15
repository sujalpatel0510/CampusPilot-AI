"""Shared FastAPI dependencies used across routers."""

from typing import Tuple

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.security import get_current_user
from app.models.faculty import Faculty
from app.models.student import Student
from app.models.subject import Subject
from app.models.user import User


def get_student_record(db: Session, user: User) -> Student:
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if student is None:
        raise NotFoundError("Student profile not found.", code="STUDENT_NOT_FOUND")
    return student


def get_student_by_identifier(db: Session, identifier: str) -> Student:
    student = db.query(Student).filter(Student.student_id == identifier).first()
    if student is None:
        raise NotFoundError(f"Student '{identifier}' was not found.", code="STUDENT_NOT_FOUND")
    return student


def get_faculty_record(db: Session, user: User) -> Faculty:
    faculty = db.query(Faculty).filter(Faculty.user_id == user.id).first()
    if faculty is None:
        raise NotFoundError("Faculty profile not found.", code="FACULTY_NOT_FOUND")
    return faculty


def ensure_subject_access(subject_id: int, user: User, db: Session) -> Subject:
    """Admin can manage any subject; faculty only subjects they teach (via timetable)."""
    subject = db.get(Subject, subject_id)
    if subject is None:
        raise NotFoundError("Subject not found.", code="SUBJECT_NOT_FOUND")
    if user.role == "admin":
        return subject
    if user.role == "faculty":
        faculty = get_faculty_record(db, user)
        from app.models.timetable import TimetableEntry

        teaches = (
            db.query(TimetableEntry.id)
            .filter(TimetableEntry.subject_id == subject_id, TimetableEntry.faculty_id == faculty.id)
            .first()
        )
        if teaches:
            return subject
    raise ForbiddenError("You can only manage subjects you are assigned to.", code="SUBJECT_ACCESS_DENIED")


def pagination(page: int, page_size: int) -> Tuple[int, int]:
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)
    return page, page_size
