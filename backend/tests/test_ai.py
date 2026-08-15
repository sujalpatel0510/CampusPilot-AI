"""AI assistant behaviour with the deterministic mock provider."""

import pytest

from app.services.ai_service import detect_intent
from tests.conftest import auth


@pytest.mark.parametrize(
    "question,intent",
    [
        ("what is my attendance percentage?", "attendance"),
        ("can I miss classes this week?", "attendance"),
        ("how many classes can I skip in CS301?", "attendance"),
        ("what is on my timetable today?", "timetable"),
        ("show my schedule for tomorrow", "timetable"),
        ("when is my next exam?", "exam"),
        ("any assignments due this week?", "assignment"),
        ("show me recent notices", "notice"),
        ("make me a study plan", "study_plan"),
        ("tell me something about the college", "general_academic_question"),
    ],
)
def test_detect_intent(question, intent):
    assert detect_intent(question) == intent


def test_chat_grounded_attendance(client, student, admin):
    from app.models.student import Student, StudentSubject
    from app.models.subject import Subject
    from app.core.database import SessionLocal

    db = SessionLocal()
    try:
        stu = db.query(Student).filter(Student.student_id == "STU001").first()
        subject = Subject(name="Operating Systems", code="CS301", department="CSE", semester=3, credits=4)
        db.add(subject)
        db.flush()
        db.add(StudentSubject(student_id=stu.id, subject_id=subject.id))
        from app.models.attendance import Attendance

        db.add(Attendance(student_id=stu.id, subject_id=subject.id, total_classes=20, attended_classes=15))
        db.commit()
    finally:
        db.close()

    response = client.post(
        "/api/v1/ai/chat",
        json={"message": "What is my attendance in CS301?"},
        headers=auth(student["token"]),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["intent"] == "attendance"
    assert body["grounded"] is True
    assert "75.0" in body["message"] or "75" in body["message"]


def test_chat_persists_conversation(client, student):
    first = client.post(
        "/api/v1/ai/chat",
        json={"message": "Show my timetable for today"},
        headers=auth(student["token"]),
    )
    assert first.status_code == 200
    conversation_id = first.json()["conversation_id"]

    conversations = client.get("/api/v1/ai/conversations", headers=auth(student["token"])).json()
    assert any(c["id"] == conversation_id for c in conversations)

    detail = client.get(f"/api/v1/ai/conversations/{conversation_id}", headers=auth(student["token"]))
    assert detail.status_code == 200
    roles = [m["role"] for m in detail.json()["messages"]]
    assert roles == ["user", "assistant"]


def test_chat_invalid_message_rejected(client, student):
    response = client.post("/api/v1/ai/chat", json={"message": ""}, headers=auth(student["token"]))

    assert response.status_code == 422


def test_student_cannot_read_other_conversation(client, student, student_two):
    other = client.post(
        "/api/v1/ai/chat",
        json={"message": "hello"},
        headers=auth(student_two["token"]),
    ).json()
    response = client.get(
        f"/api/v1/ai/conversations/{other['conversation_id']}",
        headers=auth(student["token"]),
    )
    assert response.status_code == 404
