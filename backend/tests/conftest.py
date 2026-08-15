import os
import random

os.environ["DATABASE_URL"] = "sqlite:///./test_campuspilot.db"
os.environ["AI_PROVIDER"] = "mock"
os.environ["LOG_LEVEL"] = "ERROR"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.database import Base, engine, SessionLocal  # noqa: E402
from app.core.security import create_access_token  # noqa: E402
from app.main import app  # noqa: E402
from app.schemas.auth import RegisterRequest  # noqa: E402
from app.services.auth_service import register_user  # noqa: E402

random.seed(7)


@pytest.fixture(scope="session", autouse=True)
def _db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


def make_user(role: str, email: str, db, **profile) -> dict:
    from app.models.user import User

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        return {"user": existing, "token": create_access_token(existing.id)}
    data = {"full_name": f"Test {role.title()}", "email": email, "password": "secret123"}
    data.update(profile)
    user = register_user(db, RegisterRequest(**data), role=role)
    return {"user": user, "token": create_access_token(user.id)}


@pytest.fixture
def student(db):
    return make_user(
        "student",
        "student@test.edu",
        db,
        student_id="STU001",
        college="Test College",
        department="CSE",
        course="B.Tech",
        semester=3,
        section="A",
        enrollment_year=2023,
    )


@pytest.fixture
def student_two(db):
    return make_user(
        "student",
        "student2@test.edu",
        db,
        student_id="STU002",
        college="Test College",
        department="CSE",
        course="B.Tech",
        semester=3,
        section="A",
        enrollment_year=2023,
    )


@pytest.fixture
def faculty(db):
    return make_user(
        "faculty",
        "faculty@test.edu",
        db,
        employee_id="F001",
        department="CSE",
    )


@pytest.fixture
def admin(db):
    return make_user("admin", "admin@test.edu", db)


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
