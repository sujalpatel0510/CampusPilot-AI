"""Domain exceptions and the standard API error envelope.

All handled errors are returned as:

    {
      "success": false,
      "error": {"code": "NOT_FOUND", "message": "..."}
    }

Internal stack traces are never exposed to clients.
"""

from typing import Optional


class AppError(Exception):
    """Base application error with an HTTP status and a stable error code."""

    def __init__(self, message: str, code: str = "ERROR", status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


class NotFoundError(AppError):
    def __init__(self, message: str = "Resource was not found.", code: str = "NOT_FOUND"):
        super().__init__(message=message, code=code, status_code=404)


class ConflictError(AppError):
    def __init__(self, message: str = "Resource already exists.", code: str = "CONFLICT"):
        super().__init__(message=message, code=code, status_code=409)


class ForbiddenError(AppError):
    def __init__(self, message: str = "You do not have permission to do this.", code: str = "FORBIDDEN"):
        super().__init__(message=message, code=code, status_code=403)


class UnauthorizedError(AppError):
    def __init__(self, message: str = "Authentication required.", code: str = "UNAUTHORIZED"):
        super().__init__(message=message, code=code, status_code=401)


class ValidationFailedError(AppError):
    def __init__(self, message: str, code: str = "VALIDATION_ERROR"):
        super().__init__(message=message, code=code, status_code=422)


def error_response(code: str, message: str) -> dict:
    return {"success": False, "error": {"code": code, "message": message}}
