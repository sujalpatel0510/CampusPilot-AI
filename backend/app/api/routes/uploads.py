"""Generic file upload (any authenticated user)."""

from fastapi import APIRouter, Depends, File, UploadFile

from app.core.config import settings
from app.core.exceptions import ValidationFailedError
from app.core.security import get_current_user
from app.models.user import User
from app.utils.file_parser import save_upload

router = APIRouter(prefix="/uploads", tags=["Uploads"])


@router.post("", response_model=dict, summary="Upload a file")
async def upload_file(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    raw = await file.read()
    if settings.MAX_UPLOAD_SIZE and len(raw) > settings.MAX_UPLOAD_SIZE:
        raise ValidationFailedError("File exceeds the maximum allowed size.", code="FILE_TOO_LARGE")
    return save_upload(raw, file.filename or "file", settings.UPLOAD_DIR)
