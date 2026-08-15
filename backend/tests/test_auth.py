from tests.conftest import auth


def test_register_creates_student(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "New Student",
            "email": "new.student@test.edu",
            "password": "password1",
            "student_id": "STU200",
            "college": "Test",
            "department": "CSE",
            "course": "B.Tech",
            "semester": 3,
            "section": "A",
            "enrollment_year": 2023,
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["access_token"]
    assert body["refresh_token"]
    assert body["token_type"] == "bearer"


def test_register_duplicate_email_fails(client):
    payload = {
        "full_name": "Dup User",
        "email": "dup@test.edu",
        "password": "password1",
        "student_id": "STU201",
        "department": "CSE",
        "semester": 3,
        "section": "A",
    }
    assert client.post("/api/v1/auth/register", json=payload).status_code == 200
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "EMAIL_EXISTS"


def test_register_short_password_fails(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"full_name": "Weak", "email": "weak@test.edu", "password": "123"},
    )
    assert response.status_code == 422


def test_login_success_and_wrong_password(client, student):
    good = client.post(
        "/api/v1/auth/login",
        json={"email": "student@test.edu", "password": "secret123"},
    )
    assert good.status_code == 200
    assert good.json()["user"]["user"]["role"] == "student"
    assert good.json()["user"]["student_id"] == "STU001"

    bad = client.post(
        "/api/v1/auth/login",
        json={"email": "student@test.edu", "password": "wrong-password"},
    )
    assert bad.status_code == 401
    assert bad.json()["error"]["code"] == "INVALID_CREDENTIALS"


def test_login_unknown_email(client):
    response = client.post("/api/v1/auth/login", json={"email": "ghost@test.edu", "password": "x" * 8})
    assert response.status_code == 401


def test_me_endpoint(client, student):
    response = client.get("/api/v1/auth/me", headers=auth(student["token"]))
    assert response.status_code == 200
    assert response.json()["user"]["email"] == "student@test.edu"


def test_me_without_token(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_refresh_token_flow(client, student):
    login = client.post("/api/v1/auth/login", json={"email": "student@test.edu", "password": "secret123"})
    refresh = login.json()["refresh_token"]
    response = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert response.status_code == 200
    assert response.json()["access_token"]


def test_refresh_with_access_token_rejected(client, student):
    response = client.post("/api/v1/auth/refresh", json={"refresh_token": student["token"]})
    assert response.status_code == 401
