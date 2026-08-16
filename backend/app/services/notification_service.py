"""Notification service: creation plus automatic academic triggers.

Notifications are created for:
  * assignment due soon (<= 3 days)
  * assignment overdue
  * exam approaching (<= 5 days)
  * attendance below threshold
  * new notice
  * new study material
"""

from datetime import date, datetime, timedelta
from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import get_logger
from app.models.assignment import Assignment
from app.models.exam import Exam
from app.models.notice import Notice
from app.models.notification import Notification
from app.models.student import Student, StudentSubject
from app.models.study_material import StudyMaterial
from app.models.user import User
from app.services.attendance_service import attendance_summary_for_student

logger = get_logger("notification_service")

ASSIGNMENT_DUE_SOON_DAYS = 3
EXAM_APPROACHING_DAYS = 5


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "general",
) -> Notification:
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        is_read=False,
    )
    db.add(notification)
    return notification


def _notify_if_new(user_id: int, ntype: str, title: str, message: str, db: Session) -> None:
    """Create a notification unless an identical one already exists.

    Alert checks run on every dashboard load; this keeps the table from
    growing with duplicate rows on each visit.
    """
    exists = (
        db.query(Notification.id)
        .filter(
            Notification.user_id == user_id,
            Notification.notification_type == ntype,
            Notification.title == title,
        )
        .first()
    )
    if exists:
        return
    create_notification(db, user_id, title, message, ntype)


def check_assignment_notifications(db: Session, student: Student, user: User) -> None:
    today = date.today()
    subject_ids = [ss.subject_id for ss in student.subjects]
    if not subject_ids:
        return
    assignments = (
        db.query(Assignment)
        .filter(Assignment.subject_id.in_(subject_ids))
        .all()
    )
    for assignment in assignments:
        days_left = (assignment.due_date - today).days
        if 0 <= days_left <= ASSIGNMENT_DUE_SOON_DAYS:
            _notify_if_new(
                user.id, "assignment", "Assignment due soon",
                f"'{assignment.title}' is due in {days_left} day(s).", db,
            )
        elif days_left < 0:
            _notify_if_new(
                user.id, "assignment", "Assignment overdue",
                f"'{assignment.title}' was due on {assignment.due_date}.", db,
            )


def check_exam_notifications(db: Session, student: Student, user: User) -> None:
    today = date.today()
    exams = (
        db.query(Exam)
        .filter(
            Exam.department == student.department,
            Exam.semester == student.semester,
            Exam.section == student.section,
            Exam.exam_date >= today,
        )
        .all()
    )
    for exam in exams:
        days_left = (exam.exam_date - today).days
        if 0 <= days_left <= EXAM_APPROACHING_DAYS:
            _notify_if_new(
                user.id, "exam", "Exam approaching",
                f"{exam.exam_type} for {exam.subject.code} in {days_left} day(s) at {exam.room}.",
                db,
            )


def check_attendance_notifications(
    db: Session, student: Student, user: User, summary: Optional[dict] = None
) -> None:
    if summary is None:
        summary = attendance_summary_for_student(db, student.id)
    overall = summary.get("overall")
    if overall and overall["percentage"] < settings.ATTENDANCE_THRESHOLD:
        _notify_if_new(
            user.id, "attendance", "Attendance below threshold",
            f"Your overall attendance is {overall['percentage']:.1f}% (required {settings.ATTENDANCE_THRESHOLD:g}%).",
            db,
        )


def check_student_alerts(
    db: Session, student: Student, user: User, attendance_summary: Optional[dict] = None
) -> None:
    """Create notifications for a student for all academic triggers."""
    check_assignment_notifications(db, student, user)
    check_exam_notifications(db, student, user)
    check_attendance_notifications(db, student, user, summary=attendance_summary)


def notify_notice_created(db: Session, notice: Notice) -> None:
    students = db.query(Student).all()
    for student in students:
        _notify_if_new(
            student.user_id, "notice", "New notice",
            notice.title, db,
        )


def notify_new_assignment(db: Session, assignment: Assignment) -> None:
    students = (
        db.query(Student)
        .join(StudentSubject)
        .filter(StudentSubject.subject_id == assignment.subject_id)
        .all()
    )
    for student in students:
        _notify_if_new(
            student.user_id, "assignment", "New assignment",
            f"'{assignment.title}' assigned for {assignment.subject.code}, due {assignment.due_date}.",
            db,
        )


def notify_exam_scheduled(db: Session, exam: Exam) -> None:
    students = (
        db.query(Student)
        .filter(
            Student.department == exam.department,
            Student.semester == exam.semester,
            Student.section == exam.section,
        )
        .all()
    )
    for student in students:
        _notify_if_new(
            student.user_id, "exam", "Exam scheduled",
            f"{exam.exam_type} for {exam.subject.code} on {exam.exam_date} at {exam.room}.",
            db,
        )


def notify_material_created(db: Session, material: StudyMaterial) -> None:
    students = db.query(Student).all()
    for student in students:
        _notify_if_new(
            student.user_id, "material", "New study material",
            f"'{material.title}' was added to {material.subject.name}.", db,
        )
