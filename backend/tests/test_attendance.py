"""Attendance maths (the most user-facing correctness surface)."""

import pytest

from app.services.attendance_service import (
    can_miss_classes,
    percentage_for,
    required_attended_to_maintain,
    status_for,
    validate_counts,
)
from app.core.exceptions import ValidationFailedError
from tests.conftest import auth


@pytest.mark.parametrize(
    "attended,total,expected",
    [(10, 10, 100.0), (0, 10, 0.0), (3, 4, 75.0), (7, 8, 87.5), (0, 0, 0.0)],
)
def test_percentage_for(attended, total, expected):
    assert percentage_for(attended, total) == expected


@pytest.mark.parametrize(
    "percentage,expected",
    [
        (75.0, "SAFE"),
        (74.9, "WARNING"),
        (65.0, "WARNING"),
        (64.9, "CRITICAL"),
        (40.0, "CRITICAL"),
        (100.0, "SAFE"),
    ],
)
def test_status_for(percentage, expected):
    assert status_for(percentage, threshold=75.0) == expected


def test_can_miss_classes_at_threshold():
    # Skipping x more classes requires attended/(100+x) >= 0.75.
    # 100 attended of 100 -> can skip 33 (100/(133) = 75.2%).
    assert can_miss_classes(100, 100, threshold=75.0) == 33
    # Exactly at threshold -> cannot miss any.
    assert can_miss_classes(75, 100, threshold=75.0) == 0
    # Below threshold -> 0.
    assert can_miss_classes(50, 100, threshold=75.0) == 0
    # A meaningful middle case: 15 of 20 attended, 75% -> (1500-1500)/75 = 0.
    assert can_miss_classes(15, 20, threshold=75.0) == 0
    # 16 of 20 -> (1600-1500)/75 = 1.33 -> 1.
    assert can_miss_classes(16, 20, threshold=75.0) == 1


def test_required_attended_to_maintain():
    assert required_attended_to_maintain(100, threshold=75.0) == 75
    assert required_attended_to_maintain(4, threshold=75.0) == 3
    assert required_attended_to_maintain(1, threshold=75.0) == 1


def test_validate_counts_rejects_bad_inputs():
    validate_counts(10, 5)  # ok
    with pytest.raises(ValidationFailedError):
        validate_counts(5, 10)  # attended > total
    with pytest.raises(ValidationFailedError):
        validate_counts(-1, 0)
    with pytest.raises(ValidationFailedError):
        validate_counts(0, -2)


def test_summary_math_over_sqlite(client, student, admin):
    """Full stack: admin records attendance, student summary reflects it."""
    from app.models.student import Student, StudentSubject
    from app.models.subject import Subject
    from app.core.database import SessionLocal

    db = SessionLocal()
    try:
        stu = db.query(Student).filter(Student.student_id == "STU001").first()
        subject = Subject(name="Data Structures", code="CS101", department="CSE", semester=3, credits=4)
        db.add(subject)
        db.flush()
        db.add(StudentSubject(student_id=stu.id, subject_id=subject.id))
        db.commit()
        subject_id = subject.id
        stu_id = stu.id
    finally:
        db.close()

    response = client.post(
        "/api/v1/attendance",
        json={"student_id": stu_id, "subject_id": subject_id, "total_classes": 20, "attended_classes": 15},
        headers=auth(admin["token"]),
    )
    assert response.status_code == 200

    summary = client.get("/api/v1/students/me/attendance", headers=auth(student["token"])).json()
    assert summary["overall"]["percentage"] == 75.0
    subject_row = next(s for s in summary["subjects"] if s["subject_code"] == "CS101")
    assert subject_row["percentage"] == 75.0
    assert subject_row["status"] == "SAFE"


def test_attendance_record_update(client, student, admin):
    from app.models.attendance import Attendance
    from app.models.student import Student
    from app.models.subject import Subject
    from app.core.database import SessionLocal

    db = SessionLocal()
    try:
        stu = db.query(Student).filter(Student.student_id == "STU001").first()
        subject = Subject(name="Compiler Design", code="CD101", department="CSE", semester=3, credits=3)
        db.add(subject)
        db.flush()
        record = Attendance(student_id=stu.id, subject_id=subject.id, total_classes=20, attended_classes=15)
        db.add(record)
        db.commit()
        record_id = record.id
    finally:
        db.close()

    response = client.put(
        f"/api/v1/attendance/{record_id}",
        json={"total_classes": 10, "attended_classes": 10},
        headers=auth(admin["token"]),
    )
    assert response.status_code == 200
    assert response.json()["attended_classes"] == 10


def test_attendance_invalid_counts_rejected(client, student, admin):
    from app.models.student import Student
    from app.models.subject import Subject
    from app.core.database import SessionLocal

    db = SessionLocal()
    try:
        stu = db.query(Student).filter(Student.student_id == "STU001").first()
        subject = Subject(name="Theory of Computation", code="TOC301", department="CSE", semester=3, credits=3)
        db.add(subject)
        db.commit()
        subject_id = subject.id
    finally:
        db.close()

    response = client.post(
        "/api/v1/attendance",
        json={"student_id": stu.id, "subject_id": subject_id, "total_classes": 5, "attended_classes": 7},
        headers=auth(admin["token"]),
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "ATTENDED_EXCEEDS_TOTAL"
