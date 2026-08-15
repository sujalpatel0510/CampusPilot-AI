"""Study material endpoints (read: any authenticated user, write: admin/faculty)."""

from typing import Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import ensure_subject_access
from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import NotFoundError, ValidationFailedError
from app.core.security import get_current_user, require_faculty_or_admin
from app.models.study_material import StudyMaterial
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.study_material import StudyMaterialCreate, StudyMaterialOut, StudyMaterialUpdate
from app.services.notification_service import notify_material_created
from app.utils.file_parser import save_upload

router = APIRouter(prefix="/study-materials", tags=["Study Materials"])


@router.get("", response_model=list, summary="List study materials")
def list_materials(
    subject_id: Optional[int] = None,
    search: Optional[str] = None,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(StudyMaterial)
    if subject_id:
        query = query.filter(StudyMaterial.subject_id == subject_id)
    if search:
        like = f"%{search.strip()}%"
        query = query.filter(StudyMaterial.title.ilike(like) | StudyMaterial.description.ilike(like))
    materials = query.order_by(StudyMaterial.created_at.desc()).all()
    return [StudyMaterialOut.model_validate(m) for m in materials]


@router.post(
    "/upload",
    response_model=StudyMaterialOut,
    summary="Upload a study material file",
    description="Stores the file and links it to a subject.",
)
async def upload_material(
    file: UploadFile = File(...),
    subject_id: int = Form(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    user: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db),
):
    ensure_subject_access(subject_id, user, db)
    raw = await file.read()
    if settings.MAX_UPLOAD_SIZE and len(raw) > settings.MAX_UPLOAD_SIZE:
        raise ValidationFailedError("File exceeds the maximum allowed size.", code="FILE_TOO_LARGE")
    saved = save_upload(raw, file.filename or "material", settings.UPLOAD_DIR)
    material = StudyMaterial(
        subject_id=subject_id,
        title=title,
        description=description,
        file_url=saved["file_url"],
        file_type=file.content_type or "",
        file_size=len(raw),
        uploaded_by=user.id,
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    notify_material_created(db, material)
    return material


@router.get("/{material_id}", response_model=StudyMaterialOut, summary="Get a study material")
def get_material(
    material_id: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    material = db.get(StudyMaterial, material_id)
    if material is None:
        raise NotFoundError("Study material not found.", code="MATERIAL_NOT_FOUND")
    return material


@router.put("/{material_id}", response_model=StudyMaterialOut, summary="Update a study material")
def update_material(
    material_id: int,
    payload: StudyMaterialUpdate,
    user: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db),
):
    material = db.get(StudyMaterial, material_id)
    if material is None:
        raise NotFoundError("Study material not found.", code="MATERIAL_NOT_FOUND")
    ensure_subject_access(material.subject_id, user, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(material, field, value)
    db.commit()
    db.refresh(material)
    return material


@router.delete("/{material_id}", response_model=MessageResponse, summary="Delete a study material")
def delete_material(
    material_id: int,
    user: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db),
):
    material = db.get(StudyMaterial, material_id)
    if material is None:
        raise NotFoundError("Study material not found.", code="MATERIAL_NOT_FOUND")
    ensure_subject_access(material.subject_id, user, db)
    db.delete(material)
    db.commit()
    return MessageResponse(message="Study material deleted.")
