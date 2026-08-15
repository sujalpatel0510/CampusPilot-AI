"""Assignment endpoints.

Students manage their own submissions; faculty create assignments for subjects
they teach; admin can create any.
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

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
)
from app.schemas.common import MessageResponse, Paginated
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

    faculty = get_faculty_record(db, user)
    assignment = Assignment(**payload.model_dump(), faculty_id=faculty.id)
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    notify_new_assignment(db, assignment)
    return _assignment_view(db, assignment)


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


@router.post("/{assignment_id}/submissions", response_model=MessageResponse, summary="Submit an assignment (student)")
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
