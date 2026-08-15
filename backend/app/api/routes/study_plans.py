"""Study plan endpoints (student only; scoped to the authenticated student)."""

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_student_record
from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.core.security import require_student
from app.models.study_plan import StudyPlan
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.study_plan import StudyPlanGenerateRequest, StudyPlanOut
from app.services.study_plan_service import generate_study_plan

router = APIRouter(prefix="/study-plans", tags=["Study Plans"])


@router.post("/generate", response_model=StudyPlanOut, summary="Generate a study plan")
def generate_plan(
    payload: StudyPlanGenerateRequest,
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    student = get_student_record(db, user)
    return generate_study_plan(
        db,
        student.id,
        payload.available_hours,
        payload.exam_dates,
        payload.subjects,
        payload.weak_subjects,
        payload.preferred_time,
    )


@router.get("", response_model=List[StudyPlanOut], summary="My study plans")
def list_plans(
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    student = get_student_record(db, user)
    return (
        db.query(StudyPlan)
        .filter(StudyPlan.student_id == student.id)
        .order_by(StudyPlan.created_at.desc())
        .all()
    )


@router.get("/{plan_id}", response_model=StudyPlanOut, summary="Get a study plan")
def get_plan(
    plan_id: int,
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    student = get_student_record(db, user)
    plan = db.query(StudyPlan).filter(StudyPlan.id == plan_id, StudyPlan.student_id == student.id).first()
    if plan is None:
        raise NotFoundError("Study plan not found.", code="STUDY_PLAN_NOT_FOUND")
    return plan


@router.delete("/{plan_id}", response_model=MessageResponse, summary="Delete a study plan")
def delete_plan(
    plan_id: int,
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    student = get_student_record(db, user)
    plan = db.query(StudyPlan).filter(StudyPlan.id == plan_id, StudyPlan.student_id == student.id).first()
    if plan is None:
        raise NotFoundError("Study plan not found.", code="STUDY_PLAN_NOT_FOUND")
    db.delete(plan)
    db.commit()
    return MessageResponse(message="Study plan deleted.")
