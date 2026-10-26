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


def test_assignment_submission_export_and_review(client, student, faculty, db):
    from datetime import date
    from app.models.subject import Subject
    from app.models.assignment import Assignment, AssignmentSubmission
    from app.models.faculty import Faculty
    from app.models.student import Student

    fac = db.query(Faculty).filter(Faculty.employee_id == "F001").first()
    stu = db.query(Student).filter(Student.student_id == "STU001").first()
    subject = Subject(name="Database Systems", code="DBS201", department="CSE", semester=3, credits=3)
    db.add(subject)
    db.flush()

    assignment = Assignment(
        subject_id=subject.id,
        faculty_id=fac.id,
        title="SQL Queries Lab",
        description="Write complex queries",
        due_date=date(2026, 11, 1),
        priority="high",
    )
    db.add(assignment)
    db.flush()

    sub = AssignmentSubmission(
        assignment_id=assignment.id,
        student_id=stu.id,
        status="submitted",
        file_url="https://drive.google.com/test",
    )
    db.add(sub)
    db.commit()

    # 1. Export submissions to Excel (.xlsx)
    res = client.get(
        f"/api/v1/assignments/{assignment.id}/submissions/export",
        headers=auth(faculty["token"]),
    )
    assert res.status_code == 200
    assert "spreadsheetml.sheet" in res.headers["content-type"]
    assert len(res.content) > 1000

    # Test CSV fallback as well
    csv_res = client.get(
        f"/api/v1/assignments/{assignment.id}/submissions/export?format=csv",
        headers=auth(faculty["token"]),
    )
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert "SQL Queries Lab" in csv_res.text

    # 2. Faculty reviews / approves submission
    patch_res = client.patch(
        f"/api/v1/assignments/{assignment.id}/submissions/{sub.id}",
        json={"status": "approved"},
        headers=auth(faculty["token"]),
    )
    assert patch_res.status_code == 200
    assert "approved" in patch_res.json()["message"]

