"""Admin endpoints: system statistics and bulk data import.

Bulk import flow:
1. POST /admin/import/{import_type}  -> upload CSV/XLSX, rows are parsed + validated
2. POST /admin/import/{import_type}/commit -> commit the validated rows returned above
"""

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.core.security import require_admin
from app.models.assignment import Assignment
from app.models.attendance import Attendance
from app.models.exam import Exam
from app.models.faculty import Faculty
from app.models.notice import Notice
from app.models.student import Student
from app.models.subject import Subject
from app.models.timetable import TimetableEntry
from app.models.user import User
from app.schemas.bulk_upload import ImportCommitResult, ImportValidationResult
from app.services.import_service import commit_rows, validate_rows
from app.utils.file_parser import read_table

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats", response_model=dict, summary="System statistics (admin)")
def stats(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    total_attendance = db.query(Attendance).count()
    attendance_with_total = db.query(Attendance).filter(Attendance.total_classes > 0).count()
    return {
        "users": db.query(User).count(),
        "students": db.query(Student).count(),
        "faculty": db.query(Faculty).count(),
        "subjects": db.query(Subject).count(),
        "timetable_entries": db.query(TimetableEntry).count(),
        "attendance_records": total_attendance,
        "assignments": db.query(Assignment).count(),
        "exams": db.query(Exam).count(),
        "notices": db.query(Notice).count(),
        "average_attendance": round(
            sum(a.attended_classes / a.total_classes for a in db.query(Attendance).filter(Attendance.total_classes > 0).all())
            / attendance_with_total
            * 100,
            2,
        ) if attendance_with_total else 0,
    }


@router.post(
    "/import/{import_type}",
    response_model=ImportValidationResult,
    summary="Validate a bulk import file (admin)",
    description="Parses and validates a CSV/XLSX file. Returns errors and a preview of valid rows ready to commit.",
)
async def validate_import(
    import_type: str,
    file: UploadFile = File(...),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    raw = await file.read()
    rows = read_table(raw, file.filename or "")
    return validate_rows(db, import_type, rows)


@router.post(
    "/import/{import_type}/commit",
    response_model=ImportCommitResult,
    summary="Commit validated import rows (admin)",
)
def commit_import(
    import_type: str,
    payload: dict,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    rows = payload.get("rows") or payload.get("data") or []
    return commit_rows(db, import_type, rows)
