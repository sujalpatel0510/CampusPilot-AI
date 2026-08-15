"""Attendance calculations.

The percentage is always computed dynamically:

    percentage = (attended / total) * 100

Status thresholds (configurable, default 75%):
    SAFE      percentage >= threshold
    WARNING   threshold - 10 <= percentage < threshold
    CRITICAL  percentage < threshold - 10

`can_miss` answers "how many classes can I miss and stay above threshold".
"""

from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ValidationFailedError
from app.models.attendance import Attendance
from app.models.student import Student
from app.models.subject import Subject


def percentage_for(attended: int, total: int) -> float:
    if total <= 0:
        return 0.0
    return (attended / total) * 100


def status_for(percentage: float, threshold: Optional[float] = None) -> str:
    threshold = threshold if threshold is not None else settings.ATTENDANCE_THRESHOLD
    if percentage >= threshold:
        return "SAFE"
    if percentage >= threshold - 10:
        return "WARNING"
    return "CRITICAL"


def can_miss_classes(attended: int, total: int, threshold: Optional[float] = None) -> int:
    """Classes the student can skip while remaining >= threshold."""
    threshold = threshold if threshold is not None else settings.ATTENDANCE_THRESHOLD
    if total <= 0:
        return 0
    # Need attended' >= threshold% of (total + x)
    # attended / (total + x) >= t/100  =>  x <= (100*attended - t*total) / t
    numerator = 100 * attended - threshold * total
    if numerator < 0:
        return 0
    return int(numerator // threshold)


def required_attended_to_maintain(total: int, threshold: Optional[float] = None) -> int:
    threshold = threshold if threshold is not None else settings.ATTENDANCE_THRESHOLD
    import math

    return math.ceil((threshold / 100) * total)


def validate_counts(total_classes: int, attended_classes: int) -> None:
    if total_classes < 0 or attended_classes < 0:
        raise ValidationFailedError("Attendance counts cannot be negative.", code="INVALID_ATTENDANCE")
    if attended_classes > total_classes:
        raise ValidationFailedError(
            "attended_classes cannot exceed total_classes.", code="ATTENDED_EXCEEDS_TOTAL"
        )


def attendance_row_to_dict(record: Attendance, subject: Optional[Subject] = None) -> Dict:
    subject = subject or record.subject
    percentage = percentage_for(record.attended_classes, record.total_classes)
    return {
        "id": record.id,
        "student_id": record.student_id,
        "subject_id": record.subject_id,
        "subject_code": subject.code if subject else "",
        "subject_name": subject.name if subject else "",
        "total_classes": record.total_classes,
        "attended_classes": record.attended_classes,
        "missed_classes": record.total_classes - record.attended_classes,
        "percentage": round(percentage, 2),
        "status": status_for(percentage),
    }


def subject_attendance_dicts(db: Session, student_id: int) -> List[Dict]:
    rows = (
        db.query(Attendance)
        .filter(Attendance.student_id == student_id)
        .join(Subject)
        .order_by(Subject.name)
        .all()
    )
    return [attendance_row_to_dict(r) for r in rows]


def attendance_summary_for_student(db: Session, student_id: int) -> Dict:
    subject_rows = subject_attendance_dicts(db, student_id)
    total = sum(r["total_classes"] for r in subject_rows)
    attended = sum(r["attended_classes"] for r in subject_rows)
    overall_percentage = percentage_for(attended, total)
    return {
        "overall": {
            "total_classes": total,
            "attended_classes": attended,
            "missed_classes": total - attended,
            "percentage": round(overall_percentage, 2),
            "status": status_for(overall_percentage),
            "threshold": settings.ATTENDANCE_THRESHOLD,
            "can_miss": can_miss_classes(attended, total),
            "required_to_maintain": required_attended_to_maintain(total),
        },
        "subjects": subject_rows,
    }


def attendance_for_student_subject(db: Session, student: Student, subject: Subject) -> Optional[Attendance]:
    return (
        db.query(Attendance)
        .filter(
            Attendance.student_id == student.id,
            Attendance.subject_id == subject.id,
        )
        .first()
    )
