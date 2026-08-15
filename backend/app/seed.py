"""Development seed data.

Creates an admin, faculty, students, subjects, enrollment links, attendance,
timetable, assignments, exams, notices, study materials and notifications.

The demo student mirrors the frontend demo login:
    sujal.sharma@nitd.ac.in / campus123
"""

import random
from datetime import date, datetime, time, timedelta

from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine, Base
from app.models.assignment import Assignment
from app.models.attendance import Attendance
from app.models.exam import Exam
from app.models.faculty import Faculty
from app.models.notice import Notice
from app.models.notification import Notification
from app.models.student import Student, StudentSubject
from app.models.study_material import StudyMaterial
from app.models.subject import Subject
from app.models.timetable import TimetableEntry
from app.models.user import User
from app.schemas.auth import RegisterRequest
from app.services.auth_service import register_user

random.seed(42)

DEPARTMENTS = ["CSE", "ECE", "ME", "AI&DS"]

STUDENTS = [
    ("Sujal Sharma", "sujal.sharma@nitd.ac.in", "102", "CSE", "B.Tech", 3, "A", 2023),
    ("Ananya Verma", "ananya.verma@nitd.ac.in", "103", "CSE", "B.Tech", 3, "A", 2023),
    ("Rohan Mehta", "rohan.mehta@nitd.ac.in", "104", "CSE", "B.Tech", 3, "B", 2023),
    ("Priya Nair", "priya.nair@nitd.ac.in", "105", "ECE", "B.Tech", 3, "A", 2023),
    ("Kabir Singh", "kabir.singh@nitd.ac.in", "106", "ECE", "B.Tech", 3, "B", 2023),
    ("Ishita Rao", "ishita.rao@nitd.ac.in", "107", "ME", "B.Tech", 3, "A", 2023),
    ("Arjun Gupta", "arjun.gupta@nitd.ac.in", "108", "ME", "B.Tech", 3, "B", 2023),
    ("Meera Iyer", "meera.iyer@nitd.ac.in", "109", "AI&DS", "B.Tech", 3, "A", 2023),
    ("Vivaan Joshi", "vivaan.joshi@nitd.ac.in", "110", "AI&DS", "B.Tech", 3, "B", 2023),
    ("Sara Khan", "sara.khan@nitd.ac.in", "111", "CSE", "B.Tech", 3, "B", 2023),
]

FACULTY = [
    ("Dr. Anil Kumar", "anil.kumar@nitd.ac.in", "F001", "CSE"),
    ("Dr. Radhika Menon", "radhika.menon@nitd.ac.in", "F002", "CSE"),
    ("Prof. Amit Desai", "amit.desai@nitd.ac.in", "F003", "ECE"),
]

SUBJECTS = [
    ("Operating Systems", "CS301", "CSE", 3, 4),
    ("Database Management Systems", "CS302", "CSE", 3, 4),
    ("Computer Networks", "CS303", "CSE", 3, 4),
    ("Software Engineering", "CS304", "CSE", 3, 3),
    ("Theory of Computation", "CS305", "CSE", 3, 3),
    ("Digital Logic Design", "EC301", "ECE", 3, 4),
]

# day -> list of (start_hour, start_min, end_hour, end_min, subject_code, faculty_index, room)
TIMETABLE = {
    "Monday": [(9, 0, 10, 0, "CS301", 0, "A-101"), (11, 0, 12, 0, "CS302", 1, "A-102")],
    "Tuesday": [(9, 0, 10, 0, "CS303", 0, "A-103"), (10, 0, 11, 0, "CS304", 2, "A-104")],
    "Wednesday": [(9, 0, 10, 0, "CS305", 1, "A-101"), (11, 0, 12, 0, "CS301", 0, "A-102")],
    "Thursday": [(9, 0, 10, 0, "CS302", 1, "A-103"), (10, 0, 11, 0, "CS303", 0, "A-104")],
    "Friday": [(9, 0, 10, 0, "CS304", 2, "A-101"), (11, 0, 12, 0, "CS305", 1, "A-102")],
    "Saturday": [(9, 0, 10, 0, "CS301", 0, "A-103")],
}


def _register(db: Session, data: dict, role: str) -> User:
    existing = db.query(User).filter(User.email == data["email"]).first()
    if existing:
        return existing
    request = RegisterRequest(**data)
    return register_user(db, request, role=role)


def seed(db: Session) -> None:
    today = date.today()

    # --- Users: admin, faculty, students --------------------------------
    _register(db, {"full_name": "Administrator", "email": "admin@campuspilot.edu", "password": "admin123"}, "admin")

    faculty_records: list[Faculty] = []
    for name, email, emp_id, dept in FACULTY:
        user = _register(db, {"full_name": name, "email": email, "password": "faculty123", "employee_id": emp_id, "department": dept}, "faculty")
        faculty = db.query(Faculty).filter(Faculty.user_id == user.id).first()
        if faculty is None:
            faculty = Faculty(user_id=user.id, employee_id=emp_id, department=dept)
            db.add(faculty)
            db.flush()
        faculty_records.append(faculty)

    student_records: list[Student] = []
    for name, email, sid, dept, course, sem, section, year in STUDENTS:
        password = "campus123" if email == "sujal.sharma@nitd.ac.in" else "student123"
        user = _register(
            db,
            {
                "full_name": name,
                "email": email,
                "password": password,
                "student_id": sid,
                "college": "NIT Delhi",
                "department": dept,
                "course": course,
                "semester": sem,
                "section": section,
                "enrollment_year": year,
            },
            "student",
        )
        student = db.query(Student).filter(Student.user_id == user.id).first()
        if student is None:
            student = Student(
                user_id=user.id,
                student_id=sid,
                college="NIT Delhi",
                department=dept,
                course=course,
                semester=sem,
                section=section,
                enrollment_year=year,
            )
            db.add(student)
            db.flush()
        student_records.append(student)

    # --- Subjects --------------------------------------------------------
    subject_by_code: dict[str, Subject] = {}
    for name, code, dept, sem, credits in SUBJECTS:
        subject = db.query(Subject).filter(Subject.code == code).first()
        if subject is None:
            subject = Subject(name=name, code=code, department=dept, semester=sem, credits=credits)
            db.add(subject)
            db.flush()
        subject_by_code[code] = subject

    # --- Enrollment + attendance ----------------------------------------
    for student in student_records:
        for code, subject in subject_by_code.items():
            if student.department != subject.department:
                continue
            enrolled = (
                db.query(StudentSubject)
                .filter(StudentSubject.student_id == student.id, StudentSubject.subject_id == subject.id)
                .first()
            )
            if enrolled is None:
                db.add(StudentSubject(student_id=student.id, subject_id=subject.id))
            attendance = (
                db.query(Attendance)
                .filter(Attendance.student_id == student.id, Attendance.subject_id == subject.id)
                .first()
            )
            if attendance is None:
                total = random.randint(14, 22)
                if email := student.user.email:
                    if email == "sujal.sharma@nitd.ac.in" and code in ("CS301", "CS302"):
                        attended = int(total * 0.68)  # below threshold -> demos AI + alerts
                    else:
                        attended = int(total * random.uniform(0.62, 0.95))
                else:
                    attended = int(total * random.uniform(0.62, 0.95))
                db.add(Attendance(student_id=student.id, subject_id=subject.id, total_classes=total, attended_classes=attended))

    # --- Timetable -------------------------------------------------------
    faculty_by_index = {0: faculty_records[0], 1: faculty_records[1], 2: faculty_records[2]}
    for day, slots in TIMETABLE.items():
        for sh, sm, eh, em, code, f_index, room in slots:
            subject = subject_by_code[code]
            entry = (
                db.query(TimetableEntry)
                .filter(
                    TimetableEntry.day_of_week == day,
                    TimetableEntry.subject_id == subject.id,
                )
                .first()
            )
            if entry is None:
                db.add(
                    TimetableEntry(
                        subject_id=subject.id,
                        faculty_id=faculty_by_index[f_index].id,
                        department="CSE",
                        semester=3,
                        section="A",
                        day_of_week=day,
                        start_time=time(sh, sm),
                        end_time=time(eh, em),
                        room=room,
                    )
                )

    # --- Assignments -----------------------------------------------------
    assignments = [
        (subject_by_code["CS301"], "Process Scheduling Simulator", "Implement FCFS and Round-Robin schedulers in Python.", today - timedelta(days=1), "high"),
        (subject_by_code["CS302"], "ER Diagram + SQL Queries", "Design an ER diagram for a library and write 10 SQL queries.", today + timedelta(days=2), "medium"),
        (subject_by_code["CS303"], "TCP vs UDP Lab Report", "Compare TCP and UDP with packet captures.", today + timedelta(days=5), "low"),
        (subject_by_code["CS304"], "SRS Document", "Draft a Software Requirements Specification for a hostel app.", today + timedelta(days=9), "medium"),
        (subject_by_code["CS305"], "Regular Expression Exercises", "Solve 15 regular expression and DFA conversion problems.", today + timedelta(days=3), "high"),
    ]
    for subject, title, description, due_date, priority in assignments:
        existing = db.query(Assignment).filter(Assignment.title == title).first()
        if existing is None:
            db.add(
                Assignment(
                    subject_id=subject.id,
                    faculty_id=faculty_records[0].id,
                    title=title,
                    description=description,
                    due_date=due_date,
                    priority=priority,
                )
            )

    # --- Exams -----------------------------------------------------------
    exams = [
        (subject_by_code["CS301"], "Internal Assessment 1", today + timedelta(days=3)),
        (subject_by_code["CS302"], "Internal Assessment 1", today + timedelta(days=8)),
        (subject_by_code["CS303"], "Quiz", today + timedelta(days=1)),
        (subject_by_code["CS305"], "Internal Assessment 1", today + timedelta(days=12)),
        (subject_by_code["CS304"], "Mid Term", today + timedelta(days=20)),
    ]
    for subject, exam_type, exam_date in exams:
        existing = (
            db.query(Exam)
            .filter(Exam.subject_id == subject.id, Exam.exam_type == exam_type)
            .first()
        )
        if existing is None:
            db.add(
                Exam(
                    subject_id=subject.id,
                    department="CSE",
                    semester=3,
                    section="A",
                    exam_type=exam_type,
                    exam_date=exam_date,
                    start_time=time(9, 0),
                    end_time=time(11, 0),
                    room="B-201",
                )
            )

    # --- Notices ---------------------------------------------------------
    if db.query(Notice).count() == 0:
        db.add_all(
            [
                Notice(
                    title="Mid-Semester Exam Timetable Released",
                    extracted_text="The mid-semester examination timetable for semester 3 has been released. Exams begin next week. Students are advised to check the department notice board and the portal.",
                    category="exam",
                    is_important=True,
                    ai_summary="Mid-semester exams for semester 3 start next week; timetable is released.",
                ),
                Notice(
                    title="Library Timings Extended During Exams",
                    extracted_text="The central library will remain open from 8 AM to 10 PM during the examination period starting next Monday.",
                    category="general",
                    is_important=False,
                    ai_summary="Library open 8 AM to 10 PM during exams from next Monday.",
                ),
                Notice(
                    title="Hackathon 2026 Registrations Open",
                    extracted_text="Registrations are open for the annual hackathon. Teams of up to 4 students. Deadline is the end of this month.",
                    category="events",
                    is_important=False,
                    ai_summary="Hackathon 2026 registrations open; teams of up to 4; deadline end of month.",
                ),
            ]
        )

    # --- Study materials -------------------------------------------------
    if db.query(StudyMaterial).count() == 0:
        db.add_all(
            [
                StudyMaterial(
                    subject_id=subject_by_code["CS301"].id,
                    title="Process Scheduling Notes",
                    description="Lecture slides and solved examples.",
                    file_url="/uploads/cs301-scheduling.pdf",
                    file_type="application/pdf",
                    file_size=480000,
                    uploaded_by=faculty_records[0].user_id,
                ),
                StudyMaterial(
                    subject_id=subject_by_code["CS302"].id,
                    title="SQL Practice Problems",
                    description="50 practice queries with solutions.",
                    file_url="/uploads/cs302-sql.pdf",
                    file_type="application/pdf",
                    file_size=310000,
                    uploaded_by=faculty_records[1].user_id,
                ),
            ]
        )

    # --- Notifications ---------------------------------------------------
    if db.query(Notification).count() == 0:
        for student in student_records:
            db.add(
                Notification(
                    user_id=student.user_id,
                    title="Mid-Semester Exams Start Next Week",
                    message="Your first internal assessment is scheduled soon. Check your exam schedule.",
                    notification_type="exam",
                    is_read=False,
                )
            )
        db.add(
            Notification(
                user_id=student_records[0].user_id,
                title="Attendance below 75%",
                message="Your attendance in CS301 is below the required 75%. Please attend classes.",
                notification_type="attendance",
                is_read=False,
            )
        )

    db.commit()
    print("Seed complete.")
    print("  Admin : admin@campuspilot.edu / admin123")
    print("  Demo  : sujal.sharma@nitd.ac.in / campus123")


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
