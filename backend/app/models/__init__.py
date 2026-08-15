"""All models are imported here so Alembic and the app can find them."""

from app.models.user import User
from app.models.student import Student, StudentSubject
from app.models.faculty import Faculty
from app.models.subject import Subject
from app.models.attendance import Attendance
from app.models.timetable import TimetableEntry
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.exam import Exam
from app.models.notice import Notice
from app.models.study_material import StudyMaterial
from app.models.notification import Notification
from app.models.study_plan import StudyPlan
from app.models.ai_conversation import AiConversation, AiMessage

__all__ = [
    "User",
    "Student",
    "StudentSubject",
    "Faculty",
    "Subject",
    "Attendance",
    "TimetableEntry",
    "Assignment",
    "AssignmentSubmission",
    "Exam",
    "Notice",
    "StudyMaterial",
    "Notification",
    "StudyPlan",
    "AiConversation",
    "AiMessage",
]
