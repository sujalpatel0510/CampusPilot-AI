"""AI orchestration service.

The AI never invents academic facts. For every supported intent the service:

    1. Identifies the intent from the user message.
    2. Retrieves the *actual* academic data from PostgreSQL for the student.
    3. Performs any business logic (e.g. attendance can-miss math) in code.
    4. Builds a grounded context.
    5. Sends the context + question to the configured AI provider.
    6. Validates the response.

Providers:
    * "mock"    – deterministic answers built from the retrieved facts
                  (no external service; used in development/tests).
    * "openai"  – OpenAI-compatible chat completions API.

The provider is behind an abstraction so it can be swapped without touching
routes or orchestration.
"""

from datetime import date, datetime, timedelta
from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import AppError, NotFoundError
from app.core.logging import get_logger
from app.models.ai_conversation import AiConversation, AiMessage
from app.models.assignment import Assignment
from app.models.exam import Exam
from app.models.notice import Notice
from app.models.student import Student
from app.models.study_plan import StudyPlan
from app.models.timetable import TimetableEntry
from app.services.attendance_service import (
    attendance_summary_for_student,
    can_miss_classes,
    percentage_for,
)

logger = get_logger("ai_service")

INTENTS = (
    "attendance",
    "timetable",
    "assignment",
    "exam",
    "notice",
    "study_plan",
    "general_academic_question",
)

WEEK_DAYS = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")


# ---------------------------------------------------------------------------
# Providers
# ---------------------------------------------------------------------------

class BaseAIClient:
    name = "base"

    def complete(self, system: str, question: str, facts: Dict) -> str:
        raise NotImplementedError


class MockAIClient(BaseAIClient):
    """Deterministic provider that explains the grounded facts naturally.

    Clearly a mock: it never calls an external service and only "explains"
    the facts computed by the backend. Answers are generated from the facts
    dict so they can never contradict the database.
    """

    name = "mock"

    def _render(self, facts: Dict) -> str:
        intent = facts.get("intent", "general")
        if intent == "attendance":
            return self._attendance_answer(facts)
        if intent == "timetable":
            return self._timetable_answer(facts)
        if intent == "assignment":
            return self._assignment_answer(facts)
        if intent == "exam":
            return self._exam_answer(facts)
        if intent == "notice":
            return self._notice_answer(facts)
        if intent == "study_plan":
            return self._study_plan_answer(facts)
        return self._general_answer(facts)

    def _attendance_answer(self, facts: Dict) -> str:
        overall = facts.get("overall")
        if not overall or overall.get("total_classes", 0) == 0:
            return "I don't have your attendance records yet. Please ask your faculty to update them."
        lines = [
            f"Your overall attendance is {overall['percentage']:.1f}% "
            f"({overall['attended_classes']} of {overall['total_classes']} classes) — status {overall['status']}.",
        ]
        if overall.get("can_miss") is not None:
            lines.append(
                f"Required threshold is {overall['threshold']:g}%. "
                f"You can miss {overall['can_miss']} more class(es) and stay above the threshold."
            )
        subject_facts = facts.get("subjects", [])
        if subject_facts:
            lines.append("Subject-wise breakdown:")
            for s in subject_facts:
                miss = s.get("can_miss")
                miss_text = f" (can miss {miss})" if miss is not None else ""
                lines.append(f"  • {s['subject_code']}: {s['percentage']:.1f}%{miss_text}")
        return "\n".join(lines)

    def _timetable_answer(self, facts: Dict) -> str:
        day = facts.get("day")
        entries = facts.get("entries", [])
        if not entries:
            return f"I don't see any classes scheduled for {day} in your timetable."
        lines = [f"Your classes for {day}:"]
        for e in entries:
            lines.append(f"  • {e['subject_code']} ({e['subject_name']}) {e['start_time']}–{e['end_time']} in {e['room']}")
        return "\n".join(lines)

    def _assignment_answer(self, facts: Dict) -> str:
        pending = facts.get("pending", [])
        overdue = facts.get("overdue", [])
        if not pending and not overdue:
            return "You have no pending assignments right now. Great work staying on top of things."
        lines = []
        if overdue:
            lines.append("Overdue assignments:")
            for a in overdue:
                lines.append(f"  • {a['title']} ({a['subject_code']}) was due {a['due_date']}.")
        if pending:
            lines.append("Pending assignments:")
            for a in pending:
                lines.append(f"  • {a['title']} ({a['subject_code']}) due {a['due_date']}.")
        return "\n".join(lines)

    def _exam_answer(self, facts: Dict) -> str:
        nxt = facts.get("next")
        if not nxt:
            return "I don't have any upcoming exams in your schedule."
        return (
            f"Your next exam is {nxt['exam_type']} for {nxt['subject_code']} "
            f"({nxt['subject_name']}) on {nxt['exam_date']} from {nxt['start_time']} to {nxt['end_time']} "
            f"in {nxt['room']}. That's {nxt.get('days_left', '?')} day(s) away."
        )

    def _notice_answer(self, facts: Dict) -> str:
        notices = facts.get("recent", [])
        if not notices:
            return "I don't have any college notices to summarize right now."
        lines = ["Recent notices:"]
        for n in notices[:5]:
            marker = " [IMPORTANT]" if n.get("is_important") else ""
            lines.append(f"  • {n['title']}{marker}")
            if n.get("ai_summary"):
                lines.append(f"      Summary: {n['ai_summary'][:200]}")
        return "\n".join(lines)

    def _study_plan_answer(self, facts: Dict) -> str:
        plans = facts.get("plans", [])
        if not plans:
            return "I don't have a study plan for you yet. Use the Study Planner to generate one."
        plan = plans[0]
        slots = plan.get("slots", [])
        lines = [f"Your latest study plan '{plan.get('title')}' runs from {plan.get('start_date')} to {plan.get('end_date')}."]
        if slots:
            lines.append(f"It contains {len(slots)} sessions. The first few:")
            for s in slots[:5]:
                lines.append(f"  • {s['date']} {s['start_time']}–{s['end_time']} {s['subject_code']} ({s['type']})")
        return "\n".join(lines)

    def _general_answer(self, facts: Dict) -> str:
        profile = facts.get("profile", {})
        return (
            f"I'm your CampusPilot assistant. You're {profile.get('full_name', 'a student')} "
            f"({profile.get('student_id', '')}), semester {profile.get('semester')} {profile.get('section')} "
            f"of {profile.get('department')}. Ask me about attendance, timetable, assignments, exams, "
            "notices or your study plan."
        )

    def complete(self, system: str, question: str, facts: Dict) -> str:
        return self._render(facts)


class OpenAIAIClient(BaseAIClient):
    """OpenAI-compatible chat completions client (also works with local
    Llama-compatible servers that expose the /chat/completions shape)."""

    name = "openai"

    def complete(self, system: str, question: str, facts: Dict) -> str:
        import httpx

        url = settings.OPENAI_BASE_URL.rstrip("/") + "/chat/completions"
        headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}
        payload = {
            "model": settings.OPENAI_MODEL,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": question},
            ],
            "temperature": 0.2,
        }
        response = httpx.post(url, json=payload, headers=headers, timeout=30.0)
        response.raise_for_status()
        data = response.json()
        try:
            return data["choices"][0]["message"]["content"].strip()
        except (KeyError, IndexError, AttributeError):
            raise AppError("AI provider returned an unexpected response.", code="AI_RESPONSE_ERROR", status_code=502)


def get_ai_client() -> BaseAIClient:
    if settings.is_mock_ai or not settings.OPENAI_API_KEY:
        return MockAIClient()
    return OpenAIAIClient()


# ---------------------------------------------------------------------------
# Intent detection
# ---------------------------------------------------------------------------

def detect_intent(message: str) -> str:
    text = message.lower()
    if "study plan" in text or "revision plan" in text or "plan my" in text or "plan my studies" in text:
        return "study_plan"
    if "notice" in text or "circular" in text or "announcement" in text:
        return "notice"
    if "assignment" in text or "homework" in text or "due" in text or "deadline" in text or "submission" in text:
        return "assignment"
    if "exam" in text or "test" in text or "midterm" in text or "assessment" in text or "paper" in text:
        return "exam"
    if (
        "miss" in text
        or "skip" in text
        or "bunk" in text
        or "attendance" in text
        or "present" in text
        or "absent" in text
        or "percentage" in text
    ):
        return "attendance"
    if (
        "timetable" in text
        or "schedule" in text
        or "class" in text
        or "today" in text
        or "tomorrow" in text
        or "period" in text
    ):
        return "timetable"
    return "general_academic_question"


# ---------------------------------------------------------------------------
# Context gathering (grounded in the database)
# ---------------------------------------------------------------------------

def _attendance_facts(db: Session, student: Student, question: str) -> Dict:
    summary = attendance_summary_for_student(db, student.id)
    facts: Dict = {"intent": "attendance", "overall": summary["overall"], "subjects": []}
    for s in summary["subjects"]:
        facts["subjects"].append(
            {
                "subject_code": s["subject_code"],
                "subject_name": s["subject_name"],
                "percentage": s["percentage"],
                "status": s["status"],
                "can_miss": can_miss_classes(s["attended_classes"], s["total_classes"]),
            }
        )
    # If the user names a subject, highlight it.
    lower = question.lower()
    for s in facts["subjects"]:
        if s["subject_code"].lower() in lower or s["subject_name"].lower() in lower:
            facts["target_subject"] = s
            break
    return facts


def _day_from_question(question: str) -> Optional[str]:
    lower = question.lower()
    today = date.today()
    mapping = {
        "monday": "Monday", "tuesday": "Tuesday", "wednesday": "Wednesday",
        "thursday": "Thursday", "friday": "Friday", "saturday": "Saturday",
        "sunday": "Sunday",
    }
    for key, value in mapping.items():
        if key in lower:
            return value
    if "tomorrow" in lower:
        return WEEK_DAYS[(today.weekday() + 1) % 7]
    if "today" in lower:
        return WEEK_DAYS[today.weekday()]
    return None


def _timetable_facts(db: Session, student: Student, question: str) -> Dict:
    day = _day_from_question(question) or WEEK_DAYS[date.today().weekday()]
    entries = (
        db.query(TimetableEntry)
        .filter(
            TimetableEntry.department == student.department,
            TimetableEntry.semester == student.semester,
            TimetableEntry.section == student.section,
            TimetableEntry.day_of_week == day,
        )
        .order_by(TimetableEntry.start_time)
        .all()
    )
    facts: Dict = {"intent": "timetable", "day": day, "entries": []}
    for e in entries:
        facts["entries"].append(
            {
                "subject_code": e.subject.code,
                "subject_name": e.subject.name,
                "start_time": e.start_time.strftime("%H:%M"),
                "end_time": e.end_time.strftime("%H:%M"),
                "room": e.room,
            }
        )
    return facts


def _assignment_facts(db: Session, student: Student) -> Dict:
    subject_ids = [ss.subject_id for ss in student.subjects]
    facts: Dict = {"intent": "assignment", "pending": [], "overdue": []}
    if not subject_ids:
        return facts
    today = date.today()
    upcoming = (
        db.query(Assignment)
        .filter(Assignment.subject_id.in_(subject_ids))
        .all()
    )
    for a in upcoming:
        entry = {
            "title": a.title,
            "subject_code": a.subject.code,
            "due_date": a.due_date.isoformat(),
            "priority": a.priority,
        }
        if a.due_date < today:
            facts["overdue"].append(entry)
        else:
            facts["pending"].append(entry)
    facts["pending"].sort(key=lambda x: x["due_date"])
    facts["overdue"].sort(key=lambda x: x["due_date"])
    return facts


def _exam_facts(db: Session, student: Student) -> Dict:
    today = date.today()
    exams = (
        db.query(Exam)
        .filter(
            Exam.department == student.department,
            Exam.semester == student.semester,
            Exam.section == student.section,
            Exam.exam_date >= today,
        )
        .order_by(Exam.exam_date)
        .all()
    )
    facts: Dict = {"intent": "exam", "next": None, "upcoming": []}
    for e in exams:
        entry = {
            "subject_code": e.subject.code,
            "subject_name": e.subject.name,
            "exam_type": e.exam_type,
            "exam_date": e.exam_date.isoformat(),
            "start_time": e.start_time.strftime("%H:%M"),
            "end_time": e.end_time.strftime("%H:%M"),
            "room": e.room,
            "days_left": (e.exam_date - today).days,
        }
        facts["upcoming"].append(entry)
    if facts["upcoming"]:
        facts["next"] = facts["upcoming"][0]
    return facts


def _notice_facts(db: Session, student: Student) -> Dict:
    notices = (
        db.query(Notice)
        .order_by(Notice.created_at.desc())
        .limit(10)
        .all()
    )
    facts: Dict = {"intent": "notice", "recent": []}
    for n in notices:
        facts["recent"].append(
            {
                "title": n.title,
                "category": n.category,
                "is_important": n.is_important,
                "ai_summary": n.ai_summary,
                "created_at": n.created_at.isoformat(),
            }
        )
    return facts


def _study_plan_facts(db: Session, student: Student) -> Dict:
    plans = (
        db.query(StudyPlan)
        .filter(StudyPlan.student_id == student.id)
        .order_by(StudyPlan.created_at.desc())
        .all()
    )
    facts: Dict = {"intent": "study_plan", "plans": []}
    if plans:
        plan = plans[0]
        facts["plans"].append(
            {
                "title": plan.title,
                "start_date": plan.start_date.isoformat(),
                "end_date": plan.end_date.isoformat(),
                "slots": plan.plan_data.get("slots", []),
            }
        )
    return facts


def _general_facts(db: Session, student: Student) -> Dict:
    return {
        "intent": "general_academic_question",
        "profile": {
            "full_name": student.user.full_name,
            "student_id": student.student_id,
            "department": student.department,
            "semester": student.semester,
            "section": student.section,
            "course": student.course,
        },
    }


def _gather_facts(db: Session, student: Student, intent: str, question: str) -> Dict:
    if intent == "attendance":
        return _attendance_facts(db, student, question)
    if intent == "timetable":
        return _timetable_facts(db, student, question)
    if intent == "assignment":
        return _assignment_facts(db, student)
    if intent == "exam":
        return _exam_facts(db, student)
    if intent == "notice":
        return _notice_facts(db, student)
    if intent == "study_plan":
        return _study_plan_facts(db, student)
    return _general_facts(db, student)


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

GROUNDING_PROMPT = (
    "You are CampusPilot, an academic assistant for a student. "
    "Answer ONLY using the academic facts provided in the context. "
    "NEVER invent attendance figures, exam dates, deadlines, timetable entries or notices. "
    "If the requested information is not present in the context, say clearly that you "
    "don't have that information. Be concise and friendly. Do not use markdown headings."
)


def build_context(facts: Dict) -> str:
    """Serialize facts into a readable context block for the LLM."""
    import json

    return json.dumps(facts, default=str, ensure_ascii=False, indent=2)


def validate_response(response: str, facts: Dict) -> str:
    text = response.strip()
    if not text:
        raise AppError("AI provider returned an empty response.", code="AI_EMPTY_RESPONSE", status_code=502)
    if len(text) > 8000:
        text = text[:8000]
    return text


def _get_or_create_conversation(db: Session, student: Student, conversation_id: Optional[int]) -> AiConversation:
    if conversation_id:
        conversation = (
            db.query(AiConversation)
            .filter(AiConversation.id == conversation_id, AiConversation.student_id == student.id)
            .first()
        )
        if conversation is None:
            raise NotFoundError("Conversation not found.", code="CONVERSATION_NOT_FOUND")
        return conversation
    title = f"Conversation {date.today().isoformat()}"
    conversation = AiConversation(student_id=student.id, title=title)
    db.add(conversation)
    db.flush()
    return conversation


def handle_chat(
    db: Session,
    student: Student,
    message: str,
    conversation_id: Optional[int] = None,
) -> Dict:
    conversation = _get_or_create_conversation(db, student, conversation_id)

    db.add(AiMessage(conversation_id=conversation.id, role="user", content=message))
    db.flush()

    intent = detect_intent(message)
    facts = _gather_facts(db, student, intent, message)

    if len(conversation.messages) <= 1:
        first = message[:60]
        conversation.title = first + ("…" if len(message) > 60 else "")

    client = get_ai_client()
    system = GROUNDING_PROMPT
    question = (
        "Context (authoritative, retrieved from the student's academic database):\n"
        f"{build_context(facts)}\n\nStudent question:\n{message}"
    )
    try:
        raw = client.complete(system, question, facts)
    except Exception as exc:  # noqa: BLE001
        logger.error("AI request failed", extra={"provider": client.name, "error": str(exc)})
        raise AppError("The AI assistant could not respond right now.", code="AI_UNAVAILABLE", status_code=502)
    answer = validate_response(raw, facts)

    db.add(AiMessage(conversation_id=conversation.id, role="assistant", content=answer))
    db.commit()

    return {
        "conversation_id": conversation.id,
        "message": answer,
        "intent": intent,
        "grounded": True,
    }


# ---------------------------------------------------------------------------
# Notice summarisation (used by the notice upload flow)
# ---------------------------------------------------------------------------

def summarize_text(text: str, title: str = "") -> str:
    """Generate a concise summary of notice text.

    Uses the AI provider when available; otherwise returns a deterministic
    extractive summary (first meaningful sentences)."""
    from app.services import ocr_service  # noqa: F401

    client = get_ai_client()
    if not isinstance(client, MockAIClient):
        try:
            system = (
                "Summarise the college notice in 2-3 short bullet-friendly sentences. "
                "Include dates, deadlines and any action required by students. Do not invent details."
            )
            return validate_response(client.complete(system, text[:6000], {}), {})
        except Exception:  # noqa: BLE001
            pass

    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    if not lines:
        return "No readable text found in this notice."
    summary = " ".join(lines[:6])
    return summary[:500]
