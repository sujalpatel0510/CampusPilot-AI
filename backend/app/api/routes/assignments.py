"""Assignment endpoints.

Students manage their own submissions; faculty create assignments for subjects
they teach; admin can create any.
"""

from typing import List, Optional
import csv
from datetime import datetime
import io

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session, joinedload

from app.api.deps import ensure_subject_access, get_student_record, pagination
from app.core.database import get_db
from app.core.exceptions import ForbiddenError, NotFoundError, ValidationFailedError
from app.core.security import get_current_user, require_faculty_or_admin, require_student
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.user import User
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentOut,
    AssignmentSubmissionCreate,
    AssignmentUpdate,
    SubmissionStatusUpdate,
)
from app.schemas.common import MessageResponse, Paginated
from app.services.excel_service import build_submissions_xlsx
from app.services.notification_service import notify_new_assignment

router = APIRouter(prefix="/assignments", tags=["Assignments"])


def _assignment_view(db: Session, a: Assignment) -> AssignmentOut:
    return AssignmentOut(
        id=a.id,
        subject_id=a.subject_id,
        faculty_id=a.faculty_id,
        title=a.title,
        description=a.description,
        due_date=a.due_date,
        priority=a.priority,
        created_at=a.created_at,
        subject_code=a.subject.code,
        subject_name=a.subject.name,
    )


@router.get("", response_model=Paginated[AssignmentOut], summary="List assignments")
def list_assignments(
    subject_id: Optional[int] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    page, page_size = pagination(page, page_size)
    query = db.query(Assignment)
    if subject_id:
        query = query.filter(Assignment.subject_id == subject_id)
    if priority:
        query = query.filter(Assignment.priority == priority)
    total = query.count()
    items = query.order_by(Assignment.due_date).offset((page - 1) * page_size).limit(page_size).all()
    return Paginated[AssignmentOut](
        items=[_assignment_view(db, a) for a in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
    )


@router.get("/{assignment_id}", response_model=AssignmentOut, summary="Get an assignment")
def get_assignment(
    assignment_id: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assignment = db.get(Assignment, assignment_id)
    if assignment is None:
        raise NotFoundError("Assignment not found.", code="ASSIGNMENT_NOT_FOUND")
    return _assignment_view(db, assignment)


@router.post("", response_model=AssignmentOut, summary="Create an assignment (admin/faculty)")
def create_assignment(
    payload: AssignmentCreate,
    user: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db),
):
    ensure_subject_access(payload.subject_id, user, db)
    from app.api.deps import get_faculty_record
    from app.models.faculty import Faculty
    from app.models.timetable import TimetableEntry

    if user.role == "faculty":
        faculty = get_faculty_record(db, user)
        faculty_id = faculty.id
    else:
        entry = db.query(TimetableEntry).filter(TimetableEntry.subject_id == payload.subject_id).first()
        faculty_id = entry.faculty_id if entry else db.query(Faculty.id).first()[0]

    assignment = Assignment(**payload.model_dump(), faculty_id=faculty_id)
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    notify_new_assignment(db, assignment)
    return _assignment_view(db, assignment)


@router.get("/{assignment_id}/submissions", response_model=List[dict], summary="List submissions for an assignment (faculty/admin)")
def get_assignment_submissions(
    assignment_id: int,
    user: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db),
):
    assignment = db.get(Assignment, assignment_id)
    if assignment is None:
        raise NotFoundError("Assignment not found.", code="ASSIGNMENT_NOT_FOUND")
    ensure_subject_access(assignment.subject_id, user, db)
    from app.models.student import Student

    submissions = (
        db.query(AssignmentSubmission)
        .options(joinedload(AssignmentSubmission.student).joinedload(Student.user))
        .filter(AssignmentSubmission.assignment_id == assignment_id)
        .all()
    )
    return [
        {
            "id": s.id,
            "student_id": s.student_id,
            "student_name": s.student.user.full_name if s.student and s.student.user else "Student",
            "roll_no": s.student.student_id if s.student else "",
            "file_url": s.file_url,
            "submitted_at": s.submitted_at.isoformat() if s.submitted_at else "",
            "status": s.status,
        }
        for s in submissions
    ]


@router.get("/{assignment_id}/submissions/export", summary="Export submissions to Microsoft Excel (.xlsx)")
def export_assignment_submissions(
    assignment_id: int,
    format: str = Query("xlsx", pattern="^(xlsx|csv)$"),
    user: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db),
):
    assignment = db.get(Assignment, assignment_id)
    if assignment is None:
        raise NotFoundError("Assignment not found.", code="ASSIGNMENT_NOT_FOUND")
    ensure_subject_access(assignment.subject_id, user, db)

    from app.models.student import Student

    submissions = (
        db.query(AssignmentSubmission)
        .options(joinedload(AssignmentSubmission.student).joinedload(Student.user))
        .filter(AssignmentSubmission.assignment_id == assignment_id)
        .all()
    )

    submission_records = []
    for s in submissions:
        student = s.student
        submission_records.append({
            "roll_no": student.student_id if student else "",
            "student_name": student.user.full_name if student and student.user else "",
            "email": student.user.email if student and student.user else "",
            "department": student.department if student else "",
            "semester": student.semester if student else "",
            "section": student.section if student else "",
            "status": s.status,
            "submitted_at": s.submitted_at.strftime("%Y-%m-%d %H:%M:%S") if s.submitted_at else "",
            "file_url": s.file_url or "N/A",
        })

    assignment_dict = {
        "title": assignment.title,
        "due_date": assignment.due_date.isoformat(),
        "subject_code": assignment.subject.code if assignment.subject else "",
    }

    title_slug = "".join(c if c.isalnum() else "_" for c in assignment.title)[:25]
    timestamp = datetime.utcnow().strftime("%Y%m%d")

    if format == "csv":
        output = io.StringIO()
        output.write("\ufeff")
        writer = csv.writer(output)
        writer.writerow([
            "Roll No", "Student Name", "Email", "Department", "Semester", "Section",
            "Assignment Title", "Subject Code", "Subject Name", "Due Date",
            "Submission Status", "Submission Timestamp", "Attachment / File URL"
        ])
        for s in submission_records:
            writer.writerow([
                s["roll_no"], s["student_name"], s["email"], s["department"], s["semester"], s["section"],
                assignment.title, assignment.subject.code if assignment.subject else "",
                assignment.subject.name if assignment.subject else "",
                assignment.due_date.isoformat(), s["status"], s["submitted_at"], s["file_url"]
            ])
        filename = f"Submissions_{title_slug}_{timestamp}.csv"
        return Response(
            content=output.getvalue().encode("utf-8"),
            media_type="text/csv",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )

    # Genuine openpyxl styled Excel (.xlsx)
    excel_bytes = build_submissions_xlsx(assignment_dict, submission_records)
    filename = f"Submissions_{title_slug}_{timestamp}.xlsx"
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )



@router.patch("/{assignment_id}/submissions/{submission_id}", response_model=MessageResponse, summary="Update submission status (faculty/admin)")
def update_submission_status(
    assignment_id: int,
    submission_id: int,
    payload: SubmissionStatusUpdate,
    user: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db),
):
    assignment = db.get(Assignment, assignment_id)
    if assignment is None:
        raise NotFoundError("Assignment not found.", code="ASSIGNMENT_NOT_FOUND")
    ensure_subject_access(assignment.subject_id, user, db)

    sub = db.get(AssignmentSubmission, submission_id)
    if sub is None or sub.assignment_id != assignment_id:
        raise NotFoundError("Submission not found.", code="SUBMISSION_NOT_FOUND")

    sub.status = payload.status
    db.commit()
    return MessageResponse(message=f"Submission status updated to '{payload.status}'.")



@router.put("/{assignment_id}", response_model=AssignmentOut, summary="Update an assignment (admin/faculty)")
def update_assignment(
    assignment_id: int,
    payload: AssignmentUpdate,
    user: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db),
):
    assignment = db.get(Assignment, assignment_id)
    if assignment is None:
        raise NotFoundError("Assignment not found.", code="ASSIGNMENT_NOT_FOUND")
    ensure_subject_access(assignment.subject_id, user, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(assignment, field, value)
    db.commit()
    db.refresh(assignment)
    return _assignment_view(db, assignment)


@router.delete("/{assignment_id}", response_model=MessageResponse, summary="Delete an assignment (admin/faculty)")
def delete_assignment(
    assignment_id: int,
    user: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db),
):
    assignment = db.get(Assignment, assignment_id)
    if assignment is None:
        raise NotFoundError("Assignment not found.", code="ASSIGNMENT_NOT_FOUND")
    ensure_subject_access(assignment.subject_id, user, db)
    db.delete(assignment)
    db.commit()
    return MessageResponse(message="Assignment deleted.")


@router.post("/{assignment_id}/submissions", response_model=MessageResponse, summary="Submit or update an assignment (student)")
def submit_assignment(
    assignment_id: int,
    payload: AssignmentSubmissionCreate,
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    assignment = db.get(Assignment, assignment_id)
    if assignment is None:
        raise NotFoundError("Assignment not found.", code="ASSIGNMENT_NOT_FOUND")
    student = get_student_record(db, user)
    existing = (
        db.query(AssignmentSubmission)
        .filter(
            AssignmentSubmission.assignment_id == assignment_id,
            AssignmentSubmission.student_id == student.id,
        )
        .first()
    )
    if existing:
        raise ValidationFailedError("You have already submitted this assignment.", code="ALREADY_SUBMITTED")

    db.add(
        AssignmentSubmission(
            assignment_id=assignment_id,
            student_id=student.id,
            file_url=payload.file_url or "",
            status=payload.status,
        )
    )
    db.commit()
    return MessageResponse(message="Assignment submitted.")


@router.delete("/{assignment_id}/submissions", response_model=MessageResponse, summary="Withdraw an assignment submission (student)")
def withdraw_submission(
    assignment_id: int,
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    assignment = db.get(Assignment, assignment_id)
    if assignment is None:
        raise NotFoundError("Assignment not found.", code="ASSIGNMENT_NOT_FOUND")
    student = get_student_record(db, user)
    existing = (
        db.query(AssignmentSubmission)
        .filter(
            AssignmentSubmission.assignment_id == assignment_id,
            AssignmentSubmission.student_id == student.id,
        )
        .first()
    )
    if existing:
        db.delete(existing)
        db.commit()
        return MessageResponse(message="Submission withdrawn.")
    return MessageResponse(message="No submission found.")
