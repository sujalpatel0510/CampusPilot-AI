"""Bulk import validation and commit behaviour."""

from app.core.database import SessionLocal
from app.services.import_service import commit_rows, validate_rows
from tests.conftest import auth


def _seed_subject(db):
    from app.models.subject import Subject

    subject = db.query(Subject).filter(Subject.code == "ALG301").first()
    if subject is None:
        subject = Subject(name="Algorithms", code="ALG301", department="CSE", semester=3, credits=4)
        db.add(subject)
        db.commit()
    return subject


def test_subjects_import_valid_rows():
    db = SessionLocal()
    try:
        rows = [
            {"name": "Machine Learning", "code": "ML301", "department": "CSE", "semester": 3, "credits": 3},
            {"name": "Compiler Design", "code": "CD301", "department": "CSE", "semester": 3, "credits": 4},
        ]
        result = validate_rows(db, "subjects", rows)
        assert result.valid is True
        assert result.valid_rows == 2
        assert result.errors == []
    finally:
        db.close()


def test_subjects_import_missing_columns():
    db = SessionLocal()
    try:
        rows = [{"name": "Bad Subject", "credits": 3}]
        result = validate_rows(db, "subjects", rows)
        assert result.valid is False
        assert result.invalid_rows == 1
        assert any("code" in e.field for e in result.errors)
    finally:
        db.close()


def test_subjects_import_duplicate_code():
    db = SessionLocal()
    try:
        _seed_subject(db)
        rows = [{"name": "Algorithms Again", "code": "ALG301", "department": "CSE", "semester": 3, "credits": 4}]
        result = validate_rows(db, "subjects", rows)
        assert result.valid is False
        assert any(e.field == "code" for e in result.errors)
    finally:
        db.close()


def test_subjects_import_commit_inserts():
    db = SessionLocal()
    try:
        rows = [
            {"name": "Computer Graphics", "code": "CG301", "department": "CSE", "semester": 3, "credits": 3},
        ]
        result = commit_rows(db, "subjects", rows)
        assert result.inserted == 1
        assert result.failed == 0
    finally:
        db.close()


def test_attendance_import_unknown_student_fails():
    db = SessionLocal()
    try:
        _seed_subject(db)
        from app.models.subject import Subject

        subject = db.query(Subject).filter(Subject.code == "ALG301").first()
        rows = [
            {"student_id": "NOBODY", "subject_code": subject.code, "total_classes": 10, "attended_classes": 8},
        ]
        result = validate_rows(db, "attendance", rows)
        assert result.valid is False
        assert any("student" in e.field.lower() or "student" in e.message.lower() for e in result.errors)
    finally:
        db.close()


def test_students_import_and_commit():
    db = SessionLocal()
    try:
        rows = [
            {
                "student_id": "IMPORT01",
                "full_name": "Import Student",
                "email": "import.student@test.edu",
                "password": "import123",
                "college": "Test",
                "department": "CSE",
                "course": "B.Tech",
                "semester": 3,
                "section": "A",
                "enrollment_year": 2023,
            }
        ]
        result = commit_rows(db, "students", rows)
        assert result.inserted == 1
        from app.models.student import Student

        assert db.query(Student).filter(Student.student_id == "IMPORT01").first() is not None
    finally:
        db.close()


def test_unknown_import_type_rejected(client, admin):
    from app.core.exceptions import ValidationFailedError

    db = SessionLocal()
    try:
        try:
            validate_rows(db, "telepathy", [])
            raised = False
        except ValidationFailedError:
            raised = True
        assert raised
    finally:
        db.close()


def test_import_endpoint_wrong_type(client, admin):
    response = client.post(
        "/api/v1/admin/import/telepathy",
        files={"file": ("data.csv", b"a,b\n1,2\n", "text/csv")},
        headers=auth(admin["token"]),
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "UNKNOWN_IMPORT_TYPE"


def test_import_endpoint_valid_csv(client, admin):
    csv = "name,code,department,semester,credits\nWeb Dev,WD301,CSE,3,3\n"
    response = client.post(
        "/api/v1/admin/import/subjects",
        files={"file": ("subjects.csv", csv.encode(), "text/csv")},
        headers=auth(admin["token"]),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["import_type"] == "subjects"
    assert body["valid_rows"] == 1
