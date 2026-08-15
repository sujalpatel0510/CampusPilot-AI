"""Role-based access control and per-user data isolation tests."""

from tests.conftest import auth


def test_student_cannot_access_admin_stats(client, student):
    response = client.get("/api/v1/admin/stats", headers=auth(student["token"]))
    assert response.status_code == 403


def test_faculty_cannot_access_admin_stats(client, faculty):
    response = client.get("/api/v1/admin/stats", headers=auth(faculty["token"]))
    assert response.status_code == 403


def test_admin_can_access_stats(client, admin):
    response = client.get("/api/v1/admin/stats", headers=auth(admin["token"]))
    assert response.status_code == 200


def test_student_cannot_list_students(client, student):
    response = client.get("/api/v1/students", headers=auth(student["token"]))
    assert response.status_code == 403


def test_admin_can_list_students(client, admin, student):
    response = client.get("/api/v1/students", headers=auth(admin["token"]))
    assert response.status_code == 200
    assert any(s["student_id"] == "STU001" for s in response.json())


def test_student_cannot_access_faculty_endpoint(client, student):
    response = client.get("/api/v1/faculty/me", headers=auth(student["token"]))
    assert response.status_code == 403


def test_admin_cannot_access_student_dashboard(client, admin):
    response = client.get("/api/v1/students/me/dashboard", headers=auth(admin["token"]))
    assert response.status_code == 403


def test_anonymous_rejected_everywhere(client):
    assert client.get("/api/v1/students/me").status_code == 401
    assert client.get("/api/v1/admin/stats").status_code == 401
    assert client.post("/api/v1/attendance", json={}).status_code == 401


def test_student_cannot_create_attendance(client, student):
    response = client.post(
        "/api/v1/attendance",
        json={"student_id": 1, "subject_id": 1, "total_classes": 10, "attended_classes": 8},
        headers=auth(student["token"]),
    )
    assert response.status_code == 403


def test_student_isolation_from_other_student_profile(client, student, student_two):
    """Student 1 must not see student 2's profile or attendance."""
    other_profile = client.get("/api/v1/students/STU002", headers=auth(student["token"]))
    assert other_profile.status_code == 403

    other_attendance = client.get("/api/v1/students/STU002/attendance", headers=auth(student["token"]))
    assert other_attendance.status_code == 403


def test_student_cannot_reach_other_student_via_id(client, student, student_two):
    other_attendance = client.get("/api/v1/attendance/2", headers=auth(student["token"]))
    assert other_attendance.status_code == 403


def test_faculty_cannot_manage_unassigned_subject(client, faculty, db):
    from app.models.subject import Subject

    db.add(Subject(name="Unrelated", code="XYZ", department="ECE", semester=3, credits=3))
    db.commit()
    subject = db.query(Subject).filter(Subject.code == "XYZ").first()

    response = client.post(
        "/api/v1/assignments",
        json={
            "subject_id": subject.id,
            "title": "Sneaky Assignment",
            "description": "",
            "due_date": "2026-12-31",
            "priority": "medium",
        },
        headers=auth(faculty["token"]),
    )
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "SUBJECT_ACCESS_DENIED"
