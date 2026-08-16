"""Study plan generation.

Plans are generated with deterministic backend logic using the student's real
exam dates and preferences — the AI service may polish the explanation but the
schedule itself is computed here and stored in PostgreSQL.

Slot shape mirrors the frontend planner format:
    {day, date, start_time, end_time, subject_id, subject_name, subject_code, topic, type}
"""

from datetime import date, datetime, timedelta
from typing import Dict, List

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, ValidationFailedError
from app.models.study_plan import StudyPlan
from app.models.subject import Subject

WEEK_DAYS = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")

PREFERRED_START = {
    "morning": (8, 0),
    "evening": (16, 0),
    "night": (20, 0),
}

TOPIC_NAMES = [
    "Introduction", "Core concepts", "Advanced topics", "Problem solving",
    "Past paper practice", "Key formulas", "Summary & notes", "Quick revision",
]


def generate_plan_slots(
    exams: Dict[int, date],
    subject_map: Dict[int, Subject],
    weak_subjects: List[int],
    available_hours: int,
    preferred_time: str,
) -> List[Dict]:
    today = date.today()
    if not exams:
        raise ValidationFailedError(
            "Provide at least one exam date to generate a plan.", code="NO_EXAM_DATES"
        )

    first_exam = min(exams.values())
    last_exam = max(exams.values())
    end_date = max(today, last_exam)
    if end_date == today:
        end_date = today

    slot_start_hour, slot_start_minute = PREFERRED_START.get(preferred_time, (16, 0))

    def time_plus(index: int) -> (str, str):
        start = datetime.combine(today, datetime.min.time()).replace(
            hour=slot_start_hour, minute=slot_start_minute
        ) + timedelta(hours=index)
        end = start + timedelta(hours=1)
        return start.strftime("%H:%M"), end.strftime("%H:%M")

    slots: List[Dict] = []
    current = today
    while current <= end_date:
        weekday = current.weekday()  # 0=Monday ... 6=Sunday
        if weekday < 6:
            subjects_for_day = sorted(
                exams.items(),
                key=lambda kv: (
                    0 if kv[0] in weak_subjects else 1,
                    kv[1],
                ),
            )
            for index in range(available_hours):
                if not subjects_for_day:
                    break
                subject_id, exam_day = subjects_for_day[index % len(subjects_for_day)]
                subject = subject_map[subject_id]
                is_revision = (exam_day - current).days <= 1
                start_time, end_time = time_plus(index)
                topic_index = (current.toordinal() + index) % len(TOPIC_NAMES)
                slots.append(
                    {
                        "day": weekday,
                        "date": current.isoformat(),
                        "start_time": start_time,
                        "end_time": end_time,
                        "subject_id": subject_id,
                        "subject_name": subject.name,
                        "subject_code": subject.code,
                        "topic": f"{subject.code} · {TOPIC_NAMES[topic_index]}",
                        "type": "revision" if is_revision else "study",
                    }
                )
        current += timedelta(days=1)
    return slots


def create_study_plan(
    db: Session,
    student_id: int,
    title: str,
    start_date: date,
    end_date: date,
    plan_data: Dict,
) -> StudyPlan:
    plan = StudyPlan(
        student_id=student_id,
        title=title,
        start_date=start_date,
        end_date=end_date,
        plan_data=plan_data,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def generate_study_plan(
    db: Session,
    student_id: int,
    available_hours: int,
    exam_dates: Dict[int, date],
    subjects: List[int],
    weak_subjects: List[int],
    preferred_time: str,
) -> StudyPlan:
    """Generate and persist a personalized plan from real academic data."""
    exam_dates = {int(k): v for k, v in exam_dates.items()}
    if not exam_dates:
        raise ValidationFailedError("No exam dates provided.", code="NO_EXAM_DATES")

    subjects_to_plan = subjects or list(exam_dates.keys())
    subject_map: Dict[int, Subject] = {}
    for subject_id in set(subjects_to_plan) | set(exam_dates.keys()):
        subject = db.get(Subject, subject_id)
        if subject is None:
            raise NotFoundError(f"Subject {subject_id} not found.", code="SUBJECT_NOT_FOUND")
        subject_map[subject_id] = subject

    weak = [int(s) for s in weak_subjects if int(s) in subject_map]
    slots = generate_plan_slots(exam_dates, subject_map, weak, available_hours, preferred_time)

    start = date.today()
    end = start
    for slot in slots:
        slot_date = date.fromisoformat(slot["date"])
        if slot_date > end:
            end = slot_date

    title = "Exam Focus Plan"
    plan_data = {
        "name": title,
        "form": {
            "available_hours": available_hours,
            "exam_dates": {str(k): v.isoformat() for k, v in exam_dates.items()},
            "weak_subjects": weak,
            "preferred_time": preferred_time,
        },
        "slots": slots,
    }
    return create_study_plan(db, student_id, title, start, end, plan_data)
