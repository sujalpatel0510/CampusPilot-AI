"""Notice upload flow: file persistence, OCR graceful failure, fallback summary."""

from io import BytesIO

from PIL import Image

from tests.conftest import auth


def _png_bytes() -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (20, 20), color=(255, 255, 255)).save(buffer, format="PNG")
    return buffer.getvalue()


def test_notice_upload_creates_notice(client, faculty):
    response = client.post(
        "/api/v1/notices/upload",
        files={"file": ("notice.png", _png_bytes(), "image/png")},
        data={"category": "General", "title": "Exam Notice"},
        headers=auth(faculty["token"]),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["notice"]["title"] == "Exam Notice"
    assert body["file"]["file_url"].startswith("/uploads/")
    # OCR may fail without tesseract, but the flow must not crash.
    assert "ocr_success" in body
    assert "ai_summary" in body


def test_student_cannot_upload_notice(client, student):
    response = client.post(
        "/api/v1/notices/upload",
        files={"file": ("n.txt", b"hello", "text/plain")},
        data={"category": "General"},
        headers=auth(student["token"]),
    )
    assert response.status_code == 403


def test_notice_crud(client, faculty):
    create = client.post(
        "/api/v1/notices",
        json={
            "title": "Fee Deadline",
            "extracted_text": "Pay semester fees by Friday.",
            "ai_summary": "Pay fees by Friday.",
            "category": "Fee",
            "is_important": True,
        },
        headers=auth(faculty["token"]),
    )
    assert create.status_code == 200
    notice_id = create.json()["id"]

    listing = client.get("/api/v1/notices", params={"category": "Fee"}, headers=auth(faculty["token"]))
    assert listing.status_code == 200
    assert listing.json()["total"] >= 1

    update = client.put(
        f"/api/v1/notices/{notice_id}",
        json={"is_important": False},
        headers=auth(faculty["token"]),
    )
    assert update.status_code == 200
    assert update.json()["is_important"] is False

    delete = client.delete(f"/api/v1/notices/{notice_id}", headers=auth(faculty["token"]))
    assert delete.status_code == 200


def test_student_sees_notice_via_me(client, student, faculty):
    client.post(
        "/api/v1/notices",
        json={"title": "Scholarship", "extracted_text": "Apply online.", "category": "General"},
        headers=auth(faculty["token"]),
    )
    response = client.get("/api/v1/students/me/notices", headers=auth(student["token"]))
    assert response.status_code == 200
    assert any(n["title"] == "Scholarship" for n in response.json())
