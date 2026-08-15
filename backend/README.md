# CampusPilot AI — Backend

FastAPI backend for the CampusPilot AI app: JWT auth with role-based access
(student / faculty / admin), attendance, timetable, assignments, exams, notices
with OCR + AI summarization, bulk CSV/XLSX import, a grounded AI assistant,
study-plan generation, and notifications. PostgreSQL via SQLAlchemy 2.x, Alembic
migrations, Docker Compose, pytest suite.

## Tech stack

- Python 3.11, FastAPI 0.115, Pydantic v2
- SQLAlchemy 2.x (sync) + PostgreSQL, Alembic
- PyJWT access/refresh tokens, bcrypt password hashing
- pandas/openpyxl for bulk import, PyMuPDF + pytesseract for OCR
- OpenAI-compatible chat (mock provider by default, no API key required)
- Redis (reserved; configured but not yet used by services)
- pytest + httpx TestClient

## Project layout

```
app/
  api/            routers (auth, students, faculty, subjects, attendance, ...)
  core/           config, database, exceptions, logging, security
  models/         SQLAlchemy models
  schemas/        Pydantic request/response models
  services/       business logic (auth, attendance, ai, ocr, import, ...)
  utils/          file parsing, CSV validation, uploads
  seed.py         development seed data
tests/            pytest suite (70 tests)
alembic/          migrations (0001_initial = full schema)
```

## Setup (local development)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # Windows
pip install -r requirements.txt

cp .env.example .env              # then edit DATABASE_URL / SECRET_KEY
alembic upgrade head              # create schema
python -m app.seed                # optional demo data
uvicorn app.main:app --reload
```

Docs are served at <http://localhost:8000/docs> (Swagger UI). All routes are
under `/api/v1`.

### PostgreSQL without Docker

Create a database and point `DATABASE_URL` at it:

```
postgresql+psycopg2://campuspilot:campuspilot@localhost:5432/campuspilot
```

### SQLite quick start (no external DB)

```bash
set DATABASE_URL=sqlite:///./campuspilot.db
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload
```

## Demo credentials (from `python -m app.seed`)

| Role    | Email                       | Password    |
| ------- | --------------------------- | ----------- |
| Admin   | admin@campuspilot.edu       | admin123    |
| Student | sujal.sharma@nitd.ac.in     | campus123   |

The student mirrors the frontend "one-click demo" login.

## Docker Compose

```bash
docker compose up --build
```

Starts PostgreSQL, Redis, and the API (migrations run automatically on boot).
API on <http://localhost:8000>. Set `AI_PROVIDER=openai` and `OPENAI_API_KEY`
in `docker-compose.yml` to enable the live model.

## Tests

```bash
python -m pytest -q
```

Tests run against a throwaway SQLite database (`test_campuspilot.db`) with the
mock AI provider. 70 tests cover auth, RBAC isolation, attendance math,
bulk-import validation/commit, notice OCR upload, AI chat, study plans, and the
student dashboard.

## Bulk import

- `POST /api/v1/admin/import/validate` — validate a CSV/XLSX of students against
  the existing DB (returns row-by-row status).
- `POST /api/v1/admin/import/commit` — insert only the valid rows.

Required student columns: `student_id, full_name, email, password`. Optional:
`college, department, course, semester, section, enrollment_year`. A template
can be downloaded via `GET /api/v1/admin/import/template`.

## API overview

| Area            | Base path                | Access          |
| --------------- | ------------------------ | --------------- |
| Auth            | `/auth/*`                | public          |
| Students (self) | `/students/me/*`         | student         |
| Students (mgmt) | `/students/{id}/*`       | faculty/admin   |
| Faculty (self)  | `/faculty/me/*`          | faculty         |
| Subjects        | `/subjects/*`            | admin/faculty   |
| Attendance      | `/attendance/*`          | admin/faculty   |
| Timetable       | `/timetable/*`           | admin           |
| Assignments     | `/assignments/*`         | faculty/admin   |
| Exams           | `/exams/*`               | admin           |
| Notices         | `/notices/*`             | admin (upload), all read |
| Study materials | `/study-materials/*`     | admin/faculty   |
| Notifications   | `/notifications/*`       | student         |
| Study plans     | `/study-plans/*`         | student         |
| AI assistant    | `/ai/*`                  | student         |
| Uploads         | `/uploads/*`             | static files    |
| Admin           | `/admin/*`               | admin           |

Errors follow a consistent envelope:

```json
{ "success": false, "error": { "code": "INVALID_CREDENTIALS", "message": "..." } }
```

## Key behaviors

- Attendance math: `percentage`, `status_for` (`SAFE` / `WARNING` / `CRITICAL`
  around `ATTENDANCE_THRESHOLD`), `can_miss_classes`, `classes_needed_to_reach`.
- AI assistant answers only from the student's real data (dashboard facts) when
  `AI_PROVIDER=mock`; switching to `openai` lets the LLM polish the answer.
- Notices uploads: `extract_text` (OCR/PDF) + AI summary; failures degrade
  gracefully (`ocr_success: false`).
- Study plans are generated deterministically server-side from exam dates and
  stored per student.
