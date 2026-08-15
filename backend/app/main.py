"""CampusPilot AI backend application entrypoint.

Run with: uvicorn app.main:app --reload
"""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.exceptions import AppError, error_response
from app.core.logging import setup_logging, get_logger
from app.core.database import Base, engine

logger = get_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging(settings.LOG_LEVEL)
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    logger.info(
        "CampusPilot AI backend starting",
        extra={"ai_provider": settings.AI_PROVIDER, "upload_dir": settings.UPLOAD_DIR},
    )
    yield
    logger.info("CampusPilot AI backend shutting down")


app = FastAPI(
    title="CampusPilot AI API",
    version="1.0.0",
    description=(
        "Academic management API for CampusPilot AI with JWT auth, RBAC, "
        "attendance, timetable, assignments, exams, notices, bulk import, OCR "
        "and a grounded AI assistant."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    logger.warning("Request failed", extra={"path": request.url.path, "code": exc.code})
    return JSONResponse(status_code=exc.status_code, content=error_response(exc.code, exc.message))


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        errors.append({"field": ".".join(str(p) for p in (err.get("loc") or [])), "message": err.get("msg")})
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {"code": "VALIDATION_ERROR", "message": "Request validation failed.", "details": errors},
        },
    )


@app.get("/", tags=["System"], summary="Health check")
def health():
    return {"service": "CampusPilot AI API", "status": "ok", "version": app.version}


@app.get("/health", tags=["System"], summary="Liveness probe")
def liveness():
    return {"status": "ok"}


from app.api.routes import (  # noqa: E402
    admin,
    ai,
    assignments,
    attendance,
    auth,
    exams,
    faculty,
    notices,
    notifications,
    study_materials,
    study_plans,
    students,
    subjects,
    timetable,
    uploads,
    users,
)

api = "/api/v1"
app.include_router(auth.router, prefix=api)
app.include_router(users.router, prefix=api)
app.include_router(students.router, prefix=api)
app.include_router(faculty.router, prefix=api)
app.include_router(subjects.router, prefix=api)
app.include_router(attendance.router, prefix=api)
app.include_router(timetable.router, prefix=api)
app.include_router(assignments.router, prefix=api)
app.include_router(exams.router, prefix=api)
app.include_router(notices.router, prefix=api)
app.include_router(study_materials.router, prefix=api)
app.include_router(notifications.router, prefix=api)
app.include_router(study_plans.router, prefix=api)
app.include_router(ai.router, prefix=api)
app.include_router(uploads.router, prefix=api)
app.include_router(admin.router, prefix=api)

if settings.UPLOAD_DIR:
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")
