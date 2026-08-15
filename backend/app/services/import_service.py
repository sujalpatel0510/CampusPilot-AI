"""Bulk data import pipeline.

Workflow per import type:
    parse file -> validate columns -> validate rows/types/duplicates/FKs
    -> return preview + validation errors -> (admin confirms) -> commit

Invalid rows are never inserted. Committing re-runs FK validation so a
stale preview cannot corrupt the database.
"""

from typing import Any, Callable, Dict, List, Tuple

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, ValidationFailedError
from app.core.logging import get_logger
from app.models.attendance import Attendance
from app.models.assignment import Assignment
from app.models.exam import Exam, EXAM_TYPES
from app.models.faculty import Faculty
from app.models.student import Student
from app.models.subject import Subject
from app.models.timetable import TimetableEntry
from app.models.user import User
from app.schemas.bulk_upload import ImportCommitResult, ImportErrorRow, ImportValidationResult
from app.services.auth_service import hash_password
from app.utils.csv_validator import (
    collect,
    dedupe_by,
    parse_date,
    parse_int,
    parse_str,
    parse_time,
    require_columns,
)

logger = get_logger("import_service")

IMPORT_TYPES = ("students", "subjects", "attendance", "timetable", "exams", "assignments")

ParsedRow = Dict[str, Any]  # {"row": int, "data": dict, "errors": [ImportErrorRow]}


def _finalize(name: str, parsed: List[ParsedRow]) -> ImportValidationResult:
    invalid = [p for p in parsed if p["errors"]]
    total = len(parsed)
    invalid_rows = len(invalid)
    errors: List[ImportErrorRow] = []
    for p in parsed:
        errors.extend(p["errors"])
    preview = [p["data"] for p in parsed if not p["errors"]]
    return ImportValidationResult(
        import_type=name,
        valid=invalid_rows == 0,
        total_rows=total,
        valid_rows=total - invalid_rows,
        invalid_rows=invalid_rows,
        errors=errors,
        preview=preview,
    )


# --- Students ----------------------------------------------------------------

def _validate_students(db: Session, rows: List[Dict]) -> List[ParsedRow]:
    result: List[ParsedRow] = []
    seen_emails, seen_ids = set(), set()
    required = ["full_name", "email", "student_id", "department", "semester", "section"]
    for index, row in enumerate(rows, start=1):
        errors: List[ImportErrorRow] = []
        if err := require_columns(list(row.keys()), required, "students"):
            errors.append(err)
            result.append({"row": index, "data": {}, "errors": errors})
            continue
        email = (str(row.get("email") or "").strip().lower())
        student_id = str(row.get("student_id") or "").strip()
        if "@" not in email or "." not in email.split("@")[-1]:
            collect(errors, index, "email", "Must be a valid email address.", email)
        semester, e = parse_int(row.get("semester"), "semester", index)
        if e: errors.append(e)
        if semester is not None and not 1 <= semester <= 12:
            collect(errors, index, "semester", "Must be between 1 and 12.", semester)
        if not email:
            collect(errors, index, "email", "Value is required.", "")
        if not student_id:
            collect(errors, index, "student_id", "Value is required.", "")
        if email in seen_emails:
            collect(errors, index, "email", "Duplicate email within file.", email)
        if student_id in seen_ids:
            collect(errors, index, "student_id", "Duplicate student_id within file.", student_id)
        if db.query(Student).filter(Student.student_id == student_id).first():
            collect(errors, index, "student_id", "Student already exists.", student_id)
        if email and db.query(User).filter(User.email == email).first():
            collect(errors, index, "email", "Email already registered.", email)
        seen_emails.add(email)
        seen_ids.add(student_id)
        data = {
            "full_name": str(row.get("full_name") or "").strip(),
            "email": email,
            "password": str(row.get("password") or "campus123"),
            "student_id": student_id,
            "college": str(row.get("college") or "Default Project").strip(),
            "department": str(row.get("department") or "").strip(),
            "course": str(row.get("course") or "").strip(),
            "semester": semester,
            "section": str(row.get("section") or "").strip(),
            "enrollment_year": int(row.get("enrollment_year") or 2023),
        }
        result.append({"row": index, "data": data, "errors": errors})
    return result


# --- Subjects ----------------------------------------------------------------

def _validate_subjects(db: Session, rows: List[Dict]) -> List[ParsedRow]:
    result: List[ParsedRow] = []
    seen = set()
    required = ["name", "code", "department", "semester"]
    for index, row in enumerate(rows, start=1):
        errors: List[ImportErrorRow] = []
        if err := require_columns(list(row.keys()), required, "subjects"):
            errors.append(err)
            result.append({"row": index, "data": {}, "errors": errors})
            continue
        code = str(row.get("code") or "").strip().upper()
        semester, e = parse_int(row.get("semester"), "semester", index)
        if e: errors.append(e)
        credits, e2 = parse_int(row.get("credits"), "credits", index)
        if e2: errors.append(e2)
        if code in seen:
            collect(errors, index, "code", "Duplicate code within file.", code)
        if db.query(Subject).filter(Subject.code == code).first():
            collect(errors, index, "code", "Subject already exists.", code)
        seen.add(code)
        data = {
            "name": str(row.get("name") or "").strip(),
            "code": code,
            "department": str(row.get("department") or "").strip(),
            "semester": semester,
            "credits": credits or 3,
        }
        result.append({"row": index, "data": data, "errors": errors})
    return result


# --- Attendance --------------------------------------------------------------

def _validate_attendance(db: Session, rows: List[Dict]) -> List[ParsedRow]:
    result: List[ParsedRow] = []
    seen: set = set()
    required = ["student_id", "subject_code", "total_classes", "attended_classes"]
    for index, row in enumerate(rows, start=1):
        errors: List[ImportErrorRow] = []
        if err := require_columns(list(row.keys()), required, "attendance"):
            errors.append(err)
            result.append({"row": index, "data": {}, "errors": errors})
            continue
        student = db.query(Student).filter(Student.student_id == str(row.get("student_id") or "").strip()).first()
        subject = db.query(Subject).filter(Subject.code == str(row.get("subject_code") or "").strip().upper()).first()
        total, e = parse_int(row.get("total_classes"), "total_classes", index)
        if e: errors.append(e)
        attended, e2 = parse_int(row.get("attended_classes"), "attended_classes", index)
        if e2: errors.append(e2)
        if student is None:
            collect(errors, index, "student_id", "Student does not exist.", row.get("student_id"))
        if subject is None:
            collect(errors, index, "subject_code", "Subject does not exist.", row.get("subject_code"))
        if total is not None and attended is not None and attended > total:
            collect(errors, index, "attended_classes", "attended_classes cannot exceed total_classes.")
        if student and subject:
            key = (student.id, subject.id)
            if key in seen:
                collect(errors, index, "record", "Duplicate attendance record for this student+subject.")
            seen.add(key)
        data = {
            "student_id": student.id if student else None,
            "subject_id": subject.id if subject else None,
            "total_classes": total,
            "attended_classes": attended,
        }
        result.append({"row": index, "data": data, "errors": errors})
    return result


# --- Timetable ---------------------------------------------------------------

def _subject_dept_sem(db: Session, subject: Subject, row: Dict, index: int, errors: List[ImportErrorRow]):
    department = str(row.get("department") or subject.department if subject else "").strip()
    semester, e = parse_int(row.get("semester"), "semester", index)
    if e:
        errors.append(e)
    if not semester and subject:
        semester = subject.semester
    return department or (subject.department if subject else ""), semester


def _validate_timetable(db: Session, rows: List[Dict]) -> List[ParsedRow]:
    result: List[ParsedRow] = []
    required = ["day", "subject_code", "faculty_id", "section", "start_time", "end_time"]
    valid_days = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
    for index, row in enumerate(rows, start=1):
        errors: List[ImportErrorRow] = []
        if err := require_columns(list(row.keys()), required, "timetable"):
            errors.append(err)
            result.append({"row": index, "data": {}, "errors": errors})
            continue
        subject = db.query(Subject).filter(Subject.code == str(row.get("subject_code") or "").strip().upper()).first()
        faculty = db.query(Faculty).filter(Faculty.employee_id == str(row.get("faculty_id") or "").strip()).first()
        day = str(row.get("day") or "").strip().title()
        if day not in valid_days:
            collect(errors, index, "day", f"Must be one of {', '.join(valid_days)}.", day)
        start, e1 = parse_time(row.get("start_time"), "start_time", index)
        if e1: errors.append(e1)
        end, e2 = parse_time(row.get("end_time"), "end_time", index)
        if e2: errors.append(e2)
        if start and end and end <= start:
            collect(errors, index, "end_time", "end_time must be after start_time.")
        if subject is None:
            collect(errors, index, "subject_code", "Subject does not exist.", row.get("subject_code"))
        if faculty is None:
            collect(errors, index, "faculty_id", "Faculty does not exist.", row.get("faculty_id"))
        department, semester = _subject_dept_sem(db, subject, row, index, errors)
        data = {
            "subject_id": subject.id if subject else None,
            "faculty_id": faculty.id if faculty else None,
            "department": department,
            "semester": semester,
            "section": str(row.get("section") or "").strip(),
            "day_of_week": day,
            "start_time": start,
            "end_time": end,
            "room": str(row.get("room") or "").strip(),
        }
        result.append({"row": index, "data": data, "errors": errors})
    return result


# --- Exams -------------------------------------------------------------------

def _validate_exams(db: Session, rows: List[Dict]) -> List[ParsedRow]:
    result: List[ParsedRow] = []
    required = ["subject_code", "section", "exam_type", "exam_date", "start_time", "end_time"]
    for index, row in enumerate(rows, start=1):
        errors: List[ImportErrorRow] = []
        if err := require_columns(list(row.keys()), required, "exams"):
            errors.append(err)
            result.append({"row": index, "data": {}, "errors": errors})
            continue
        subject = db.query(Subject).filter(Subject.code == str(row.get("subject_code") or "").strip().upper()).first()
        exam_type = str(row.get("exam_type") or "").strip().title()
        if exam_type not in EXAM_TYPES:
            collect(errors, index, "exam_type", f"Must be one of {', '.join(EXAM_TYPES)}.", exam_type)
        exam_date, e = parse_date(row.get("exam_date"), "exam_date", index)
        if e: errors.append(e)
        start, e1 = parse_time(row.get("start_time"), "start_time", index)
        if e1: errors.append(e1)
        end, e2 = parse_time(row.get("end_time"), "end_time", index)
        if e2: errors.append(e2)
        if start and end and end <= start:
            collect(errors, index, "end_time", "end_time must be after start_time.")
        if subject is None:
            collect(errors, index, "subject_code", "Subject does not exist.", row.get("subject_code"))
        department, semester = _subject_dept_sem(db, subject, row, index, errors)
        data = {
            "subject_id": subject.id if subject else None,
            "department": department,
            "semester": semester,
            "section": str(row.get("section") or "").strip(),
            "exam_type": exam_type,
            "exam_date": exam_date,
            "start_time": start,
            "end_time": end,
            "room": str(row.get("room") or "").strip(),
        }
        result.append({"row": index, "data": data, "errors": errors})
    return result


# --- Assignments -------------------------------------------------------------

def _validate_assignments(db: Session, rows: List[Dict]) -> List[ParsedRow]:
    result: List[ParsedRow] = []
    priorities = ("low", "medium", "high")
    required = ["subject_code", "title", "due_date"]
    for index, row in enumerate(rows, start=1):
        errors: List[ImportErrorRow] = []
        if err := require_columns(list(row.keys()), required, "assignments"):
            errors.append(err)
            result.append({"row": index, "data": {}, "errors": errors})
            continue
        subject = db.query(Subject).filter(Subject.code == str(row.get("subject_code") or "").strip().upper()).first()
        if subject is None:
            collect(errors, index, "subject_code", "Subject does not exist.", row.get("subject_code"))
        due_date, e = parse_date(row.get("due_date"), "due_date", index)
        if e: errors.append(e)
        priority = str(row.get("priority") or "medium").lower()
        if priority not in priorities:
            collect(errors, index, "priority", f"Must be one of {', '.join(priorities)}.", priority)
        faculty_id = None
        raw_faculty = str(row.get("faculty_id") or "").strip()
        if raw_faculty:
            faculty = db.query(Faculty).filter(Faculty.employee_id == raw_faculty).first()
            if faculty is None:
                collect(errors, index, "faculty_id", "Faculty does not exist.", raw_faculty)
            else:
                faculty_id = faculty.id
        data = {
            "subject_id": subject.id if subject else None,
            "faculty_id": faculty_id,
            "title": str(row.get("title") or "").strip(),
            "description": str(row.get("description") or "").strip(),
            "due_date": due_date,
            "priority": priority,
        }
        result.append({"row": index, "data": data, "errors": errors})
    return result


_VALIDATORS: Dict[str, Callable[[Session, List[Dict]], List[ParsedRow]]] = {
    "students": _validate_students,
    "subjects": _validate_subjects,
    "attendance": _validate_attendance,
    "timetable": _validate_timetable,
    "exams": _validate_exams,
    "assignments": _validate_assignments,
}


def validate_rows(db: Session, import_type: str, rows: List[Dict]) -> ImportValidationResult:
    if import_type not in _VALIDATORS:
        raise ValidationFailedError(f"Unknown import type: {import_type}", code="UNKNOWN_IMPORT_TYPE")
    parsed = _VALIDATORS[import_type](db, rows)
    return _finalize(import_type, parsed)


def commit_rows(db: Session, import_type: str, rows: List[Dict]) -> ImportCommitResult:
    if import_type not in _VALIDATORS:
        raise ValidationFailedError(f"Unknown import type: {import_type}", code="UNKNOWN_IMPORT_TYPE")
    parsed = _VALIDATORS[import_type](db, rows)
    valid = [p["data"] for p in parsed if not p["errors"] and p["data"]]
    inserted, updated, failed = 0, 0, 0
    try:
        for data in valid:
            try:
                if import_type == "students":
                    inserted += _commit_student(db, data)
                elif import_type == "subjects":
                    inserted += _commit_subject(db, data)
                elif import_type == "attendance":
                    inserted += _commit_attendance(db, data)
                elif import_type == "timetable":
                    inserted += _commit_timetable(db, data)
                elif import_type == "exams":
                    inserted += _commit_exam(db, data)
                elif import_type == "assignments":
                    inserted += _commit_assignment(db, data)
            except Exception as exc:  # noqa: BLE001
                failed += 1
                logger.warning("Import row failed", extra={"import_type": import_type, "error": str(exc)})
        db.commit()
    except Exception:
        db.rollback()
        raise
    return ImportCommitResult(import_type=import_type, inserted=inserted, updated=updated, failed=failed)


def _commit_student(db: Session, data: Dict) -> int:
    if db.query(Student).filter(Student.student_id == data["student_id"]).first():
        return 0
    user = User(
        full_name=data["full_name"],
        email=data["email"],
        password_hash=hash_password(data["password"]),
        role="student",
        is_active=True,
    )
    db.add(user)
    db.flush()
    student_fields = {
        k: v
        for k, v in data.items()
        if k not in ("password", "email", "full_name") and k != "student_id"
    }
    db.add(Student(user_id=user.id, student_id=data["student_id"], **student_fields))
    return 1


def _commit_subject(db: Session, data: Dict) -> int:
    if db.query(Subject).filter(Subject.code == data["code"]).first():
        return 0
    db.add(Subject(**data))
    return 1


def _commit_attendance(db: Session, data: Dict) -> int:
    existing = (
        db.query(Attendance)
        .filter(Attendance.student_id == data["student_id"], Attendance.subject_id == data["subject_id"])
        .first()
    )
    if existing:
        existing.total_classes = data["total_classes"]
        existing.attended_classes = data["attended_classes"]
        return 1
    db.add(Attendance(**data))
    return 1


def _commit_timetable(db: Session, data: Dict) -> int:
    db.add(TimetableEntry(**data))
    return 1


def _commit_exam(db: Session, data: Dict) -> int:
    db.add(Exam(**data))
    return 1


def _commit_assignment(db: Session, data: Dict) -> int:
    db.add(Assignment(**data))
    return 1
