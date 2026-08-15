"""Study plan generation and dashboard integration."""

from datetime import date

from tests.conftest import auth


def _seed_subject(db):
    from app.models.subject import Subject

    subject = db.query(Subject).filter(Subject.code == "PHY201").first()
    if subject is None:
        subject = Subject(name="Physics II", code="PHY201", department="CSE", semester=3, credits=3)
        db.add(subject)
        db.commit()
    return subject


def test_generate_study_plan(client, student):
    from app.core.database import SessionLocal

    db = SessionLocal()
    try:
        subject = _seed_subject(db)
        subject_id = subject.id
    finally:
        db.close()

    response = client.post(
        "/api/v1/study-plans/generate",
        json={
            "exam_dates": {str(subject_id): "2026-08-20"},
            "subjects": [subject_id],
            "preferred_time": "evening",
            "available_hours": 2,
        },
        headers=auth(student["token"]),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["plan_data"]
    assert body["student_id"]

    plans = client.get("/api/v1/study-plans", headers=auth(student["token"])).json()
    assert any(p["id"] == body["id"] for p in plans)


def test_student_cannot_see_other_plan(client, student, student_two):
    from app.core.database import SessionLocal

    db = SessionLocal()
    try:
        subject = _seed_subject(db)
        subject_id = subject.id
    finally:
        db.close()

    other = client.post(
        "/api/v1/study-plans/generate",
        json={"exam_dates": {str(subject_id): "2026-08-21"}, "preferred_time": "morning"},
        headers=auth(student_two["token"]),
    ).json()

    response = client.get(f"/api/v1/study-plans/{other['id']}", headers=auth(student["token"]))
    assert response.status_code == 404


def test_dashboard_shape(client, student):
    response = client.get("/api/v1/students/me/dashboard", headers=auth(student["token"]))
    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {
        "student",
        "attendance",
        "assignments",
        "upcoming_exams",
        "next_exam",
        "timetable",
        "timetable_today",
        "notices",
        "unread_notifications",
    }
    assert set(body["attendance"].keys()) == {"overall", "subjects"}
    assert body["student"]["student_id"] == "STU001"


def test_notifications_flow(client, student):
    notifications = client.get("/api/v1/notifications", headers=auth(student["token"])).json()
    ids = [n["id"] for n in notifications]

    if ids:
        target = ids[0]
        mark = client.patch(
            f"/api/v1/notifications/{target}/read",
            headers=auth(student["token"]),
        )
        assert mark.status_code == 200

    read_all = client.post("/api/v1/notifications/read-all", headers=auth(student["token"]))
    assert read_all.status_code == 200

    unread = client.get("/api/v1/notifications", params={"unread_only": True}, headers=auth(student["token"])).json()
    assert unread == []


def test_assignment_submission_flow(client, student, faculty):
    from app.models.assignment import Assignment
    from app.models.subject import Subject
    from app.core.database import SessionLocal

    db = SessionLocal()
    try:
        subject = Subject(name="Networks", code="NET301", department="CSE", semester=3, credits=3)
        db.add(subject)
        db.flush()
        from app.models.faculty import Faculty
        from app.models.student import Student, StudentSubject

        fac = db.query(Faculty).first()
        stu = db.query(Student).filter(Student.student_id == "STU001").first()
        db.add(StudentSubject(student_id=stu.id, subject_id=subject.id))
        db.flush()
        assignment = Assignment(
            subject_id=subject.id,
            faculty_id=fac.id,
            title="Lab 1",
            description="",
            due_date=date(2026, 12, 31),
            priority="medium",
        )
        db.add(assignment)
        db.commit()
        assignment_id = assignment.id
    finally:
        db.close()

    submit = client.post(
        f"/api/v1/assignments/{assignment_id}/submissions",
        json={"file_url": "/uploads/lab1.zip", "status": "submitted"},
        headers=auth(student["token"]),
    )
    assert submit.status_code == 200

    duplicate = client.post(
        f"/api/v1/assignments/{assignment_id}/submissions",
        json={"file_url": "/uploads/lab1-v2.zip"},
        headers=auth(student["token"]),
    )
    assert duplicate.status_code == 422
    assert duplicate.json()["error"]["code"] == "ALREADY_SUBMITTED"

    mine = client.get("/api/v1/students/me/assignments", headers=auth(student["token"])).json()
    lab = next(a for a in mine if a["id"] == assignment_id)
    assert lab["status"] == "completed"
