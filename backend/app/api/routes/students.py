"""Student endpoints.

`/students/me/*` are scoped to the authenticated student and enforce strict
data isolation. `/students/{student_id}/*` require faculty or admin access.
"""

from datetime import date, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_student_by_identifier, pagination
from app.core.database import get_db
from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.logging import get_logger
from app.core.security import require_admin, require_faculty_or_admin, require_student
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.attendance import Attendance
from app.models.exam import Exam
from app.models.notice import Notice
from app.models.notification import Notification
from app.models.student import Student
from app.models.study_material import StudyMaterial
from app.models.timetable import TimetableEntry
from app.models.user import User
from app.schemas.auth import RegisterRequest
from app.schemas.common import MessageResponse
from app.schemas.student import StudentCreate, StudentOut, StudentUpdate
from app.schemas.subject import SubjectWithAttendance
from app.schemas.timetable import TimetableDayOut
from app.services.attendance_service import attendance_summary_for_student
from app.services.auth_service import get_student_by_user, hash_password, register_user
from app.services.notification_service import check_student_alerts

logger = get_logger("students")

router = APIRouter(prefix="/students", tags=["Students"])

WEEK_DAYS = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")


# --- helpers -----------------------------------------------------------------

def _student_out(student: Student) -> dict:
    return {
        "id": student.id,
        "user_id": student.user_id,
        "student_id": student.student_id,
        "college": student.college,
        "department": student.department,
        "course": student.course,
        "semester": student.semester,
        "section": student.section,
        "enrollment_year": student.enrollment_year,
        "full_name": student.user.full_name,
        "email": student.user.email,
        "role": student.user.role,
        "is_active": student.user.is_active,
    }


def _timetable_entry_out(entry: TimetableEntry) -> dict:
    return {
        "id": entry.id,
        "subject_id": entry.subject_id,
        "faculty_id": entry.faculty_id,
        "department": entry.department,
        "semester": entry.semester,
        "section": entry.section,
        "day_of_week": entry.day_of_week,
        "start_time": entry.start_time.strftime("%H:%M"),
        "end_time": entry.end_time.strftime("%H:%M"),
        "room": entry.room,
        "subject_code": entry.subject.code,
        "subject_name": entry.subject.name,
        "faculty_name": entry.faculty.user.full_name if entry.faculty else "",
    }


def _exam_out(exam: Exam) -> dict:
    today = date.today()
    return {
        "id": exam.id,
        "subject_id": exam.subject_id,
        "department": exam.department,
        "semester": exam.semester,
        "section": exam.section,
        "exam_type": exam.exam_type,
        "exam_date": exam.exam_date.isoformat(),
        "start_time": exam.start_time.strftime("%H:%M"),
        "end_time": exam.end_time.strftime("%H:%M"),
        "room": exam.room,
        "subject_code": exam.subject.code,
        "subject_name": exam.subject.name,
        "days_left": (exam.exam_date - today).days,
        "is_today": exam.exam_date == today,
    }


def _assignment_out(assignment: Assignment, status: Optional[str]) -> dict:
    return {
        "id": assignment.id,
        "subject_id": assignment.subject_id,
        "faculty_id": assignment.faculty_id,
        "title": assignment.title,
        "description": assignment.description,
        "due_date": assignment.due_date.isoformat(),
        "priority": assignment.priority,
        "created_at": assignment.created_at.isoformat(),
        "subject_code": assignment.subject.code,
        "subject_name": assignment.subject.name,
        "status": status,
    }


def _student_exams(db: Session, student: Student) -> List[dict]:
    exams = (
        db.query(Exam)
        .filter(
            Exam.department == student.department,
            Exam.semester == student.semester,
            Exam.section == student.section,
        )
        .order_by(Exam.exam_date)
        .all()
    )
    return [_exam_out(e) for e in exams]


def _student_assignments(db: Session, student: Student) -> List[dict]:
    subject_ids = [ss.subject_id for ss in student.subjects]
    if not subject_ids:
        return []
    assignments = (
        db.query(Assignment)
        .filter(Assignment.subject_id.in_(subject_ids))
        .order_by(Assignment.due_date)
        .all()
    )
    submitted = {
        s.assignment_id
        for s in db.query(AssignmentSubmission).filter(AssignmentSubmission.student_id == student.id).all()
    }
    today = date.today()
    result = []
    for a in assignments:
        if a.id in submitted:
            status = "completed"
        elif a.due_date < today:
            status = "overdue"
        else:
            status = "pending"
        result.append(_assignment_out(a, status))
    return result


def _student_timetable(db: Session, student: Student) -> List[TimetableDayOut]:
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    days: List[TimetableDayOut] = []
    for index, day in enumerate(WEEK_DAYS):
        entries = (
            db.query(TimetableEntry)
            .filter(
                TimetableEntry.department == student.department,
                TimetableEntry.semester == student.semester,
                TimetableEntry.section == student.section,
                TimetableEntry.day_of_week == day,
            )
            .order_by(TimetableEntry.start_time)
            .all()
        )
        day_date = week_start + timedelta(days=index)
        days.append(
            TimetableDayOut(
                day=day,
                date=day_date.isoformat(),
                entries=[_timetable_entry_out(e) for e in entries],
            )
        )
    return days


def _enrolled_subject_ids(db: Session, student: Student) -> List[int]:
    return [ss.subject_id for ss in student.subjects]


# --- /me endpoints (student only) -------------------------------------------

@router.get("/me", response_model=dict, summary="My student profile")
def my_profile(
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    student = get_student_by_user(db, user)
    return _student_out(student)


@router.get(
    "/me/dashboard",
    response_model=dict,
    summary="Student dashboard",
    description="Returns a frontend-friendly dashboard payload (attendance, pending work, upcoming exams, today's timetable, unread items).",
)
def my_dashboard(
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    student = get_student_by_user(db, user)
    check_student_alerts(db, student, user)

    attendance = attendance_summary_for_student(db, student.id)
    assignments = _student_assignments(db, student)
    exams = _student_exams(db, student)
    timetable = _student_timetable(db, student)

    today = date.today()
    today_name = WEEK_DAYS[today.weekday()]
    today_entries = next((d.entries for d in timetable if d.day == today_name), [])

    recent_notices = (
        db.query(Notice)
        .order_by(Notice.created_at.desc())
        .limit(5)
        .all()
    )
    unread_notifications = (
        db.query(Notification)
        .filter(Notification.user_id == user.id, Notification.is_read.is_(False))
        .count()
    )

    return {
        "student": _student_out(student),
        "attendance": attendance,
        "assignments": {
            "pending": [a for a in assignments if a["status"] == "pending"],
            "overdue": [a for a in assignments if a["status"] == "overdue"],
            "completed": [a for a in assignments if a["status"] == "completed"],
        },
        "upcoming_exams": exams,
        "next_exam": next((e for e in exams if e["days_left"] and e["days_left"] >= 0), None),
        "timetable": timetable,
        "timetable_today": today_entries,
        "notices": [
            {
                "id": n.id,
                "title": n.title,
                "category": n.category,
                "is_important": n.is_important,
                "ai_summary": n.ai_summary,
                "created_at": n.created_at.isoformat(),
            }
            for n in recent_notices
        ],
        "unread_notifications": unread_notifications,
    }


@router.get("/me/attendance", response_model=dict, summary="My attendance summary")
def my_attendance(
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    student = get_student_by_user(db, user)
    return attendance_summary_for_student(db, student.id)


@router.get("/me/timetable", response_model=List[TimetableDayOut], summary="My weekly timetable")
def my_timetable(
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    student = get_student_by_user(db, user)
    return _student_timetable(db, student)


@router.get("/me/assignments", response_model=List[dict], summary="My assignments")
def my_assignments(
    status: Optional[str] = None,
    subject_id: Optional[int] = None,
    priority: Optional[str] = None,
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    student = get_student_by_user(db, user)
    result = _student_assignments(db, student)
    if status:
        result = [a for a in result if a["status"] == status]
    if subject_id:
        result = [a for a in result if a["subject_id"] == subject_id]
    if priority:
        result = [a for a in result if a["priority"] == priority]
    return result


@router.get("/me/exams", response_model=List[dict], summary="My exams")
def my_exams(
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    student = get_student_by_user(db, user)
    return _student_exams(db, student)


@router.get("/me/exams/next", response_model=Optional[dict], summary="My next exam")
def my_next_exam(
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    student = get_student_by_user(db, user)
    exams = _student_exams(db, student)
    today = date.today()
    upcoming = [e for e in exams if (e["days_left"] or 0) >= 0]
    return next((e for e in upcoming if e["exam_date"] >= today.isoformat()), None)


@router.get("/me/notices", response_model=List[dict], summary="College notices")
def my_notices(
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    notices = db.query(Notice).order_by(Notice.created_at.desc()).all()
    return [
        {
            "id": n.id,
            "title": n.title,
            "category": n.category,
            "is_important": n.is_important,
            "ai_summary": n.ai_summary,
            "original_file_url": n.original_file_url,
            "created_at": n.created_at.isoformat(),
        }
        for n in notices
    ]


@router.get("/me/materials", response_model=List[dict], summary="Study materials for my subjects")
def my_materials(
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    student = get_student_by_user(db, user)
    subject_ids = _enrolled_subject_ids(db, student)
    if not subject_ids:
        return []
    materials = (
        db.query(StudyMaterial)
        .filter(StudyMaterial.subject_id.in_(subject_ids))
        .order_by(StudyMaterial.created_at.desc())
        .all()
    )
    return [
        {
            "id": m.id,
            "subject_id": m.subject_id,
            "title": m.title,
            "description": m.description,
            "file_url": m.file_url,
            "file_type": m.file_type,
            "file_size": m.file_size,
            "created_at": m.created_at.isoformat(),
            "subject_code": m.subject.code,
            "subject_name": m.subject.name,
        }
        for m in materials
    ]


@router.get("/me/notifications", response_model=List[dict], summary="My notifications")
def my_notifications(
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    items = (
        db.query(Notification)
        .filter(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "notification_type": n.notification_type,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat(),
        }
        for n in items
    ]


@router.patch("/me/notifications/{notification_id}/read", response_model=MessageResponse, summary="Mark a notification read")
def mark_notification_read(
    notification_id: int,
    user: User = Depends(require_student),
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


# --- Admin / faculty management endpoints ------------------------------------

@router.get("", response_model=List[dict], summary="List students (admin/faculty)")
def list_students(
    search: Optional[str] = None,
    department: Optional[str] = None,
    semester: Optional[int] = None,
    section: Optional[str] = None,
    _: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Student)
    if search:
        like = f"%{search.strip()}%"
        query = query.join(User).filter(Student.student_id.ilike(like) | User.full_name.ilike(like))
    if department:
        query = query.filter(Student.department == department)
    if semester:
        query = query.filter(Student.semester == semester)
    if section:
        query = query.filter(Student.section == section)
    return [_student_out(s) for s in query.order_by(Student.student_id).all()]


@router.get("/{student_identifier}", response_model=dict, summary="Get a student (admin/faculty)")
def get_student(
    student_identifier: str,
    _: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db),
):
    student = get_student_by_identifier(db, student_identifier)
    return _student_out(student)


@router.get("/{student_identifier}/attendance", response_model=dict, summary="A student's attendance (admin/faculty)")
def get_student_attendance(
    student_identifier: str,
    _: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db),
):
    student = get_student_by_identifier(db, student_identifier)
    return attendance_summary_for_student(db, student.id)


@router.get("/{student_identifier}/subjects", response_model=List[SubjectWithAttendance], summary="A student's subjects (admin/faculty)")
def get_student_subjects(
    student_identifier: str,
    _: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db),
):
    student = get_student_by_identifier(db, student_identifier)
    rows = (
        db.query(Attendance)
        .filter(Attendance.student_id == student.id)
        .join(Student)
        .all()
    )
    result = []
    for r in rows:
        subject = r.subject
        result.append(
            SubjectWithAttendance(
                id=subject.id,
                name=subject.name,
                code=subject.code,
                department=subject.department,
                semester=subject.semester,
                credits=subject.credits,
                total_classes=r.total_classes,
                attended_classes=r.attended_classes,
                percentage=round((r.attended_classes / r.total_classes * 100), 2) if r.total_classes else 0,
            )
        )
    return result


@router.post("", response_model=StudentOut, summary="Create a student (admin)")
def create_student(
    payload: StudentCreate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    register_user(
        db,
        RegisterRequest(
            full_name=payload.full_name,
            email=payload.email,
            password=payload.password,
            student_id=payload.student_id,
            college=payload.college,
            department=payload.department,
            course=payload.course,
            semester=payload.semester,
            section=payload.section,
            enrollment_year=payload.enrollment_year,
        ),
        role="student",
    )
    student = get_student_by_identifier(db, payload.student_id)
    return _student_out(student)


@router.patch("/{student_identifier}", response_model=StudentOut, summary="Update a student (admin)")
def update_student(
    student_identifier: str,
    payload: StudentUpdate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    student = get_student_by_identifier(db, student_identifier)
    user = student.user
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.email is not None:
        user.email = str(payload.email).lower()
    if payload.password is not None:
        user.password_hash = hash_password(payload.password)
    if payload.is_active is not None:
        user.is_active = payload.is_active
    for field in ("student_id", "college", "department", "course", "semester", "section", "enrollment_year"):
        value = getattr(payload, field)
        if value is not None:
            setattr(student, field, value)
    db.commit()
    db.refresh(student)
    return _student_out(student)


@router.delete("/{student_identifier}", response_model=MessageResponse, summary="Delete a student (admin)")
def delete_student(
    student_identifier: str,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    student = get_student_by_identifier(db, student_identifier)
    db.delete(student.user)  # cascades to student via ondelete / relationship
    db.commit()
    return MessageResponse(message="Student deleted.")
