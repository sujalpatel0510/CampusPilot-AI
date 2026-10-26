"""Faculty endpoints.

Faculty can see their own profile, the subjects they teach (derived from the
timetable) and the students enrolled in those subjects. All data is scoped to
the authenticated faculty member.
"""

from typing import List, Optional
import csv
from datetime import datetime
import io
import math

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.api.deps import get_faculty_record, get_student_record, pagination
from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.core.logging import get_logger
from app.core.security import get_current_user, require_admin, require_faculty
from app.models.attendance import Attendance
from app.models.faculty import Faculty
from app.models.notification import Notification
from app.models.student import Student, StudentSubject
from app.models.subject import Subject
from app.models.timetable import TimetableEntry
from app.models.user import User
from app.schemas.attendance import BulkAttendanceMarkRequest
from app.schemas.common import MessageResponse
from app.schemas.faculty import FacultyCreate, FacultyOut, FacultyUpdate
from app.services.attendance_service import (
    can_miss_classes,
    percentage_for,
    status_for,
)
from app.services.auth_service import hash_password, register_user
from app.services.excel_service import build_attendance_xlsx
from app.services.notification_service import check_student_alerts

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
    if not subjects and faculty.department:
        subjects = db.query(Subject).filter(Subject.department == faculty.department).all()
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
    subject = db.get(Subject, subject_id)
    if teaches is None and not (subject and faculty.department and subject.department == faculty.department):
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


def _attendance_guidance(attended: int, total: int, threshold: float = 75.0) -> str:
    if total <= 0:
        return "No classes conducted yet"
    pct = (attended / total) * 100.0
    if pct >= threshold:
        missable = can_miss_classes(attended, total, threshold)
        if missable > 0:
            return f"Safe: Can afford to miss {missable} upcoming class{'es' if missable != 1 else ''}"
        return "Safe: On 75% boundary"
    else:
        needed = math.ceil((threshold / 100.0 * total - attended) / (1.0 - threshold / 100.0))
        return f"Warning: Must attend next {needed} consecutive class{'es' if needed != 1 else ''} to reach 75%"


@router.get("/me/subjects/{subject_id}/attendance/export", summary="Export attendance for a subject to Microsoft Excel (.xlsx)")
def export_subject_attendance(
    subject_id: int,
    format: str = Query("xlsx", pattern="^(xlsx|csv)$"),
    user: User = Depends(require_faculty),
    db: Session = Depends(get_db),
):
    faculty = get_faculty_record(db, user)
    teaches = (
        db.query(TimetableEntry)
        .filter(TimetableEntry.subject_id == subject_id, TimetableEntry.faculty_id == faculty.id)
        .first()
    )
    subject = db.get(Subject, subject_id)
    if teaches is None and not (subject and faculty.department and subject.department == faculty.department):
        raise NotFoundError("You do not teach this subject.", code="SUBJECT_ACCESS_DENIED")

    links = db.query(StudentSubject).filter(StudentSubject.subject_id == subject_id).all()
    records = []
    for link in links:
        student = db.get(Student, link.student_id)
        if not student:
            continue
        attendance = (
            db.query(Attendance)
            .filter(Attendance.student_id == student.id, Attendance.subject_id == subject_id)
            .first()
        )
        total = attendance.total_classes if attendance else 0
        attended = attendance.attended_classes if attendance else 0
        pct = percentage_for(attended, total) if total else 0.0
        status = status_for(pct) if attendance else "NO_RECORD"
        guidance = _attendance_guidance(attended, total)

        records.append({
            "student_id": student.student_id,
            "full_name": student.user.full_name,
            "email": student.user.email,
            "department": student.department,
            "semester": student.semester,
            "section": student.section,
            "total_classes": total,
            "attended_classes": attended,
            "percentage": pct,
            "status": status,
            "guidance": guidance,
        })

    subject_dict = {
        "id": subject.id if subject else subject_id,
        "name": subject.name if subject else "Subject",
        "code": subject.code if subject else f"SUBJ{subject_id}",
        "department": subject.department if subject else "CSE",
        "semester": subject.semester if subject else 1,
    }

    code_slug = (subject_dict["code"]).replace(" ", "_")
    timestamp = datetime.utcnow().strftime("%Y%m%d")

    if format == "csv":
        output = io.StringIO()
        output.write("\ufeff")
        writer = csv.writer(output)
        writer.writerow([
            "Roll No", "Student Name", "Email", "Department", "Semester", "Section",
            "Subject Code", "Subject Name", "Total Classes", "Attended Classes",
            "Missed Classes", "Attendance %", "Status", "Eligibility Guidance"
        ])
        for r in records:
            writer.writerow([
                r["student_id"], r["full_name"], r["email"], r["department"], r["semester"], r["section"],
                subject_dict["code"], subject_dict["name"], r["total_classes"], r["attended_classes"],
                r["total_classes"] - r["attended_classes"], f"{r['percentage']:.2f}%", r["status"], r["guidance"]
            ])
        filename = f"Attendance_{code_slug}_{timestamp}.csv"
        return Response(
            content=output.getvalue().encode("utf-8"),
            media_type="text/csv",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )

    # Genuine openpyxl styled Excel (.xlsx)
    excel_bytes = build_attendance_xlsx(subject_dict, records)
    filename = f"Attendance_{code_slug}_{timestamp}.xlsx"
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )


@router.post("/me/subjects/{subject_id}/intervene", summary="AI At-Risk Student Early Warning & Intervention")
def intervene_at_risk_students(
    subject_id: int,
    student_id: Optional[int] = None,
    user: User = Depends(require_faculty),
    db: Session = Depends(get_db),
):
    faculty = get_faculty_record(db, user)
    subject = db.get(Subject, subject_id)
    if not subject:
        raise NotFoundError("Subject not found.", code="SUBJECT_NOT_FOUND")

    links = db.query(StudentSubject).filter(StudentSubject.subject_id == subject_id).all()
    if student_id:
        links = [l for l in links if l.student_id == student_id]

    notified = 0
    for link in links:
        student = db.get(Student, link.student_id)
        if not student:
            continue
        attendance = (
            db.query(Attendance)
            .filter(Attendance.student_id == student.id, Attendance.subject_id == subject_id)
            .first()
        )
        total = attendance.total_classes if attendance else 0
        attended = attendance.attended_classes if attendance else 0
        pct = percentage_for(attended, total) if total else 0.0

        if pct < 75.0 and total > 0:
            needed = math.ceil((0.75 * total - attended) / 0.25)
            # Create intervention alert notification
            notif = Notification(
                user_id=student.user_id,
                title=f"⚠️ Attendance Intervention: {subject.name}",
                message=(
                    f"Prof. {user.full_name} has flagged your attendance in {subject.name} ({subject.code}) "
                    f"at {pct:.1f}% (below the 75% cutoff). Action Required: You must attend the next "
                    f"{needed} consecutive classes to regain examination eligibility."
                ),
                is_read=False,
            )
            db.add(notif)
            notified += 1

    db.commit()
    return {
        "notified_count": notified,
        "message": f"AI academic recovery notices delivered to {notified} at-risk students.",
    }



@router.post("/me/subjects/{subject_id}/attendance/bulk-mark", response_model=MessageResponse, summary="Bulk mark attendance for all enrolled students")
def bulk_mark_attendance(
    subject_id: int,
    payload: BulkAttendanceMarkRequest,
    user: User = Depends(require_faculty),
    db: Session = Depends(get_db),
):
    faculty = get_faculty_record(db, user)
    teaches = (
        db.query(TimetableEntry)
        .filter(TimetableEntry.subject_id == subject_id, TimetableEntry.faculty_id == faculty.id)
        .first()
    )
    subject = db.get(Subject, subject_id)
    if teaches is None and not (subject and faculty.department and subject.department == faculty.department):
        raise NotFoundError("You do not teach this subject.", code="SUBJECT_ACCESS_DENIED")

    links = db.query(StudentSubject).filter(StudentSubject.subject_id == subject_id).all()
    absent_set = set(payload.absent_student_ids or [])
    present_set = set(payload.present_student_ids or []) if payload.present_student_ids is not None else None

    count = 0
    for link in links:
        student = db.get(Student, link.student_id)
        if not student:
            continue
        attendance = (
            db.query(Attendance)
            .filter(Attendance.student_id == student.id, Attendance.subject_id == subject_id)
            .first()
        )
        if present_set is not None:
            attended_today = student.id in present_set
        elif payload.all_present:
            attended_today = student.id not in absent_set
        else:
            attended_today = False

        if attendance:
            attendance.total_classes += 1
            if attended_today:
                attendance.attended_classes += 1
        else:
            attendance = Attendance(
                student_id=student.id,
                subject_id=subject_id,
                total_classes=1,
                attended_classes=1 if attended_today else 0,
            )
            db.add(attendance)
        count += 1
        check_student_alerts(db, student, student.user)

    db.commit()
    return MessageResponse(message=f"Attendance recorded for {count} enrolled students.")



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
