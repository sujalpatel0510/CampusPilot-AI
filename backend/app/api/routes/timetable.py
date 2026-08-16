"""Timetable endpoints (read: any authenticated user, write: admin/faculty)."""

from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.core.security import get_current_user, require_faculty_or_admin
from app.models.timetable import TimetableEntry
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.timetable import TimetableCreate as TimetableEntryCreate
from app.schemas.timetable import TimetableUpdate as TimetableEntryUpdate

router = APIRouter(prefix="/timetable", tags=["Timetable"])


def _entry_out(entry: TimetableEntry) -> dict:
    return {
        "id": entry.id,
        "subject_id": entry.subject_id,
        "faculty_id": entry.faculty_id,
        "department": entry.department,
        "semester": entry.semester,
        "section": entry.section,
        "day_of_week": entry.day_of_week,
        "start_time": entry.start_time.strftime("%H:%M"),
        "end_time": entry.end_time.strftime("%H:%M"),
        "room": entry.room,
        "subject_code": entry.subject.code,
        "subject_name": entry.subject.name,
        "faculty_name": entry.faculty.user.full_name if entry.faculty else "",
    }


@router.get("", response_model=list, summary="List timetable entries")
def list_timetable(
    department: Optional[str] = None,
    semester: Optional[int] = None,
    section: Optional[str] = None,
    day_of_week: Optional[str] = None,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(TimetableEntry)
    if department:
        query = query.filter(TimetableEntry.department == department)
    if semester:
        query = query.filter(TimetableEntry.semester == semester)
    if section:
        query = query.filter(TimetableEntry.section == section)
    if day_of_week:
        query = query.filter(TimetableEntry.day_of_week == day_of_week)
    entries = query.order_by(TimetableEntry.day_of_week, TimetableEntry.start_time).all()
    return [_entry_out(e) for e in entries]


@router.get("/{entry_id}", response_model=dict, summary="Get a timetable entry")
def get_entry(
    entry_id: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = db.get(TimetableEntry, entry_id)
    if entry is None:
        raise NotFoundError("Timetable entry not found.", code="TIMETABLE_NOT_FOUND")
    return _entry_out(entry)


@router.post("", response_model=dict, summary="Create a timetable entry (admin/faculty)")
def create_entry(
    payload: TimetableEntryCreate,
    _: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db),
):
    entry = TimetableEntry(**payload.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return _entry_out(entry)


@router.put("/{entry_id}", response_model=dict, summary="Update a timetable entry (admin/faculty)")
def update_entry(
    entry_id: int,
    payload: TimetableEntryUpdate,
    _: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db),
):
    entry = db.get(TimetableEntry, entry_id)
    if entry is None:
        raise NotFoundError("Timetable entry not found.", code="TIMETABLE_NOT_FOUND")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)
    db.commit()
    db.refresh(entry)
    return _entry_out(entry)


@router.delete("/{entry_id}", response_model=MessageResponse, summary="Delete a timetable entry (admin/faculty)")
def delete_entry(
    entry_id: int,
    _: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db),
):
    entry = db.get(TimetableEntry, entry_id)
    if entry is None:
        raise NotFoundError("Timetable entry not found.", code="TIMETABLE_NOT_FOUND")
    db.delete(entry)
    db.commit()
    return MessageResponse(message="Timetable entry deleted.")
