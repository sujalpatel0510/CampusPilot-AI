import type {
  AppNotification,
  Assignment,
  AttendanceOverview,
  Conversation,
  Exam,
  Notice,
  StudentProfile,
  StudyMaterial,
  StudyPlan,
  Subject,
  TimetableEntry,
} from "@/types";

export const STUDENT_PROFILE: StudentProfile = {
  id: "stu-001",
  name: "Sujal Sharma",
  email: "sujal.sharma@nitd.ac.in",
  college: "National Institute of Technology, Delhi",
  course: "B.Tech CSE",
  semester: 4,
  rollNo: "22CSE045",
  department: "Computer Science & Engineering",
  batch: "2024-2028",
  phone: "+91 98765 43210",
};

export const SUBJECTS: Subject[] = [
  { id: "sub-dsa", name: "Data Structures & Algorithms", code: "CS201", faculty: "Dr. Anil Mehta", room: "B-101", color: "#6366F1" },
  { id: "sub-dbms", name: "Database Management Systems", code: "CS302", faculty: "Prof. Rajesh Sharma", room: "B-204", color: "#8B5CF6" },
  { id: "sub-os", name: "Operating Systems", code: "CS305", faculty: "Dr. Kavita Iyer", room: "C-102", color: "#0EA5E9" },
  { id: "sub-de", name: "Digital Electronics", code: "EC204", faculty: "Prof. Harsh Patel", room: "A-105", color: "#F59E0B" },
  { id: "sub-cn", name: "Computer Networks", code: "CS402", faculty: "Dr. Sunil Rao", room: "B-301", color: "#10B981" },
  { id: "sub-math", name: "Probability & Statistics", code: "MA204", faculty: "Dr. Pooja Joshi", room: "C-201", color: "#F43F5E" },
];

export const ATTENDANCE: AttendanceOverview = {
  overall: 82,
  totalClasses: 189,
  attended: 155,
  subjects: [
    { subjectId: "sub-dsa", totalClasses: 32, attended: 29, percentage: 91, status: "good", trend: [88, 90, 89, 91, 92, 90, 91, 91] },
    { subjectId: "sub-dbms", totalClasses: 31, attended: 26, percentage: 84, status: "good", trend: [86, 85, 87, 83, 85, 84, 83, 84] },
    { subjectId: "sub-os", totalClasses: 33, attended: 27, percentage: 82, status: "good", trend: [85, 83, 84, 81, 82, 83, 81, 82] },
    { subjectId: "sub-de", totalClasses: 30, attended: 21, percentage: 70, status: "warning", trend: [78, 76, 75, 74, 72, 73, 71, 70] },
    { subjectId: "sub-cn", totalClasses: 29, attended: 26, percentage: 90, status: "good", trend: [88, 87, 89, 88, 90, 91, 89, 90] },
    { subjectId: "sub-math", totalClasses: 34, attended: 26, percentage: 76, status: "warning", trend: [80, 79, 78, 77, 76, 77, 76, 76] },
  ],
  trend: [
    { week: "Jun 22", percentage: 86 },
    { week: "Jun 29", percentage: 84 },
    { week: "Jul 06", percentage: 85 },
    { week: "Jul 13", percentage: 83 },
    { week: "Jul 20", percentage: 84 },
    { week: "Jul 27", percentage: 82 },
    { week: "Aug 03", percentage: 83 },
    { week: "Aug 10", percentage: 82 },
  ],
};

export const TIMETABLE: TimetableEntry[] = [
  { id: "tt-01", subjectId: "sub-dsa", day: 1, startTime: "09:00", endTime: "10:00", room: "B-101", type: "lecture", frequency: "weekly" },
  { id: "tt-02", subjectId: "sub-dbms", day: 1, startTime: "10:00", endTime: "11:00", room: "B-204", type: "lecture", frequency: "weekly" },
  { id: "tt-03", subjectId: "sub-de", day: 1, startTime: "11:00", endTime: "12:00", room: "A-105", type: "lecture", frequency: "weekly" },
  { id: "tt-04", subjectId: "sub-cn", day: 1, startTime: "14:00", endTime: "15:00", room: "B-301", type: "lecture", frequency: "weekly" },
  { id: "tt-05", subjectId: "sub-os", day: 1, startTime: "15:00", endTime: "16:00", room: "C-102", type: "lecture", frequency: "weekly" },

  { id: "tt-06", subjectId: "sub-math", day: 2, startTime: "09:00", endTime: "10:00", room: "C-201", type: "lecture", frequency: "weekly" },
  { id: "tt-07", subjectId: "sub-os", day: 2, startTime: "10:00", endTime: "11:00", room: "C-102", type: "lecture", frequency: "weekly" },
  { id: "tt-08", subjectId: "sub-dsa", day: 2, startTime: "11:00", endTime: "13:00", room: "CS Lab 2", type: "lab", frequency: "weekly" },
  { id: "tt-09", subjectId: "sub-dbms", day: 2, startTime: "14:00", endTime: "16:00", room: "CS Lab 3", type: "lab", frequency: "weekly" },

  { id: "tt-10", subjectId: "sub-de", day: 3, startTime: "09:00", endTime: "10:00", room: "A-105", type: "lecture", frequency: "weekly" },
  { id: "tt-11", subjectId: "sub-cn", day: 3, startTime: "10:00", endTime: "11:00", room: "B-301", type: "lecture", frequency: "weekly" },
  { id: "tt-12", subjectId: "sub-math", day: 3, startTime: "11:00", endTime: "12:00", room: "C-201", type: "lecture", frequency: "weekly" },
  { id: "tt-13", subjectId: "sub-dsa", day: 3, startTime: "14:00", endTime: "15:00", room: "B-101", type: "lecture", frequency: "weekly" },
  { id: "tt-14", subjectId: "sub-os", day: 3, startTime: "15:00", endTime: "16:00", room: "C-102", type: "lecture", frequency: "weekly" },

  { id: "tt-15", subjectId: "sub-dbms", day: 4, startTime: "09:00", endTime: "10:00", room: "B-204", type: "lecture", frequency: "weekly" },
  { id: "tt-16", subjectId: "sub-math", day: 4, startTime: "10:00", endTime: "11:00", room: "C-201", type: "lecture", frequency: "weekly" },
  { id: "tt-17", subjectId: "sub-de", day: 4, startTime: "11:00", endTime: "13:00", room: "EC Lab 1", type: "lab", frequency: "weekly" },
  { id: "tt-18", subjectId: "sub-cn", day: 4, startTime: "14:00", endTime: "16:00", room: "CS Lab 4", type: "lab", frequency: "weekly" },

  { id: "tt-19", subjectId: "sub-os", day: 5, startTime: "09:00", endTime: "10:00", room: "C-102", type: "lecture", frequency: "weekly" },
  { id: "tt-20", subjectId: "sub-dsa", day: 5, startTime: "10:00", endTime: "11:00", room: "B-101", type: "lecture", frequency: "weekly" },
  { id: "tt-21", subjectId: "sub-dbms", day: 5, startTime: "11:00", endTime: "12:00", room: "B-204", type: "lecture", frequency: "weekly" },
  { id: "tt-22", subjectId: "sub-math", day: 5, startTime: "14:00", endTime: "15:00", room: "C-201", type: "lecture", frequency: "weekly" },
  { id: "tt-23", subjectId: "sub-de", day: 5, startTime: "15:00", endTime: "16:00", room: "A-105", type: "lecture", frequency: "weekly" },

  { id: "tt-24", subjectId: "sub-cn", day: 6, startTime: "09:00", endTime: "11:00", room: "CS Lab 4", type: "lab", frequency: "alternate" },
];

export const ASSIGNMENTS: Assignment[] = [
  { id: "as-01", subjectId: "sub-dsa", title: "AVL Tree Implementation", description: "Implement AVL trees with insert, delete and balance factor visualisation in C++.", dueDate: "2026-08-18", submitted: false, status: "pending", weightage: 10 },
  { id: "as-02", subjectId: "sub-dbms", title: "ER Diagram — College Database", description: "Design a complete ER diagram for a college management system with at least 8 entities.", dueDate: "2026-08-19", submitted: false, status: "pending", weightage: 8 },
  { id: "as-03", subjectId: "sub-os", title: "Producer-Consumer Problem", description: "Simulate the producer-consumer problem with semaphores and deadlock avoidance in Java.", dueDate: "2026-08-21", submitted: false, status: "pending", weightage: 12 },
  { id: "as-04", subjectId: "sub-de", title: "K-Map Minimisation Lab Report", description: "Simplify 4-variable Boolean expressions using K-maps and verify with logic gates.", dueDate: "2026-08-16", submitted: true, status: "completed", weightage: 5 },
  { id: "as-05", subjectId: "sub-cn", title: "OSI vs TCP/IP Comparison", description: "Write a detailed comparison report covering all layers with real-world examples.", dueDate: "2026-08-22", submitted: false, status: "pending", weightage: 7 },
  { id: "as-06", subjectId: "sub-math", title: "Probability Problem Set 4", description: "Solve 20 problems covering Bayes' theorem, distributions and expected values.", dueDate: "2026-08-24", submitted: false, status: "pending", weightage: 9 },
  { id: "as-07", subjectId: "sub-dsa", title: "Graph Traversal Algorithms", description: "Implement BFS and DFS with applications — cycle detection and shortest path.", dueDate: "2026-08-12", submitted: false, status: "overdue", weightage: 10 },
  { id: "as-08", subjectId: "sub-dbms", title: "Normalisation Worksheet", description: "Normalise the given relations up to 3NF with clear justifications for each step.", dueDate: "2026-08-10", submitted: true, status: "completed", weightage: 6 },
  { id: "as-09", subjectId: "sub-os", title: "Process Scheduling Simulation", description: "Compare FCFS, SJF and Round Robin on the given process set; submit Gantt charts.", dueDate: "2026-08-08", submitted: true, status: "completed", weightage: 10 },
];

export const EXAMS: Exam[] = [
  { id: "ex-01", subjectId: "sub-dbms", title: "DBMS Mid-Term", date: "2026-08-24", startTime: "10:00", endTime: "12:00", room: "B-204", type: "mid-term", completed: false, marks: 50, syllabus: ["ER Modelling", "Relational Algebra", "SQL Queries", "Normalisation up to 3NF"] },
  { id: "ex-02", subjectId: "sub-dsa", title: "DSA Quiz 3", date: "2026-08-19", startTime: "14:00", endTime: "15:00", room: "B-101", type: "quiz", completed: false, marks: 20, syllabus: ["Trees", "Heaps", "AVL Trees"] },
  { id: "ex-03", subjectId: "sub-os", title: "OS Unit Test 2", date: "2026-08-28", startTime: "09:00", endTime: "11:00", room: "C-102", type: "internal", completed: false, marks: 40, syllabus: ["Process Synchronisation", "Deadlocks", "Memory Management"] },
  { id: "ex-04", subjectId: "sub-de", title: "Digital Electronics Mid-Term", date: "2026-09-02", startTime: "10:00", endTime: "12:00", room: "A-105", type: "mid-term", completed: false, marks: 50, syllabus: ["Boolean Algebra", "K-Maps", "Combinational Circuits", "Sequential Circuits"] },
  { id: "ex-05", subjectId: "sub-cn", title: "Computer Networks Quiz", date: "2026-09-05", startTime: "14:00", endTime: "15:00", room: "B-301", type: "quiz", completed: false, marks: 20, syllabus: ["Layered Architecture", "Physical Layer", "Data Link Layer"] },
  { id: "ex-06", subjectId: "sub-math", title: "Probability & Stats Unit Test", date: "2026-09-08", startTime: "09:00", endTime: "11:00", room: "C-201", type: "internal", completed: false, marks: 40, syllabus: ["Probability Distributions", "Hypothesis Testing"] },
  { id: "ex-07", subjectId: "sub-dsa", title: "DSA Unit Test 1", date: "2026-07-30", startTime: "09:00", endTime: "11:00", room: "B-101", type: "internal", completed: true, marks: 40, syllabus: ["Arrays", "Linked Lists", "Stacks & Queues"], },
];

export const NOTICES: Notice[] = [
  {
    id: "nt-01",
    title: "Examination Form — Summer 2026 Semester",
    content:
      "The institute has released the examination form for the Summer 2026 semester. All students must fill and submit the form by 28 August 2026 on the college portal. The exam fee of ₹1,500 is payable online. Forms submitted late will incur a fine of ₹500. Students with pending fees or attendance below 75% in any subject may be blocked from the exams.",
    summary: "Fill the exam form by 28 Aug; fee ₹1,500; late fine ₹500.",
    aiSummary:
      "The institute has released the examination form for the Summer 2026 semester. All students must fill and submit the form by 28 August 2026 on the college portal. The exam fee of ₹1,500 is payable online. Forms submitted late will incur a fine of ₹500. Students with pending fees or attendance below 75% in any subject may be blocked from the exams.",
    category: "Examination",
    date: "2026-08-12",
    isImportant: true,
    hasAttachment: true,
    postedBy: "Office of the Controller of Examinations",
  },
  {
    id: "nt-02",
    title: "Semester Fee Payment Reminder",
    content:
      "The second instalment of semester fees must be paid by 20 August 2026 through the payment portal. Late payment attracts a penalty of ₹200 per week. Students with pending dues will not be permitted to appear for mid-term examinations.",
    summary: "Pay semester fee instalment by 20 Aug; penalty after that.",
    aiSummary:
      "The second instalment of semester fees must be paid by 20 August 2026 through the payment portal. Late payment attracts a penalty of ₹200 per week. Students with pending dues will not be permitted to appear for mid-term examinations.",
    category: "Fee",
    date: "2026-08-10",
    isImportant: true,
    hasAttachment: false,
    postedBy: "Accounts Section",
  },
  {
    id: "nt-03",
    title: "Annual Tech Fest — Aurora 2026 Registrations",
    content:
      "Registrations for Aurora 2026, the annual techno-cultural fest, are now open. The fest will be held from 19 to 21 September 2026. Events include hackathons, coding competitions, robotics and cultural nights. Register before 5 September 2026 to avail early-bird passes.",
    summary: "Aurora 2026 on 19–21 Sep; register by 5 Sep for early-bird passes.",
    aiSummary:
      "Registrations for Aurora 2026, the annual techno-cultural fest, are now open. The fest will be held from 19 to 21 September 2026. Events include hackathons, coding competitions, robotics and cultural nights. Register before 5 September 2026 to avail early-bird passes.",
    category: "Event",
    date: "2026-08-08",
    isImportant: false,
    hasAttachment: true,
    postedBy: "Aurora Student Council",
  },
  {
    id: "nt-04",
    title: "Campus Placement Drive — Infosys & TCS",
    content:
      "On-campus placement drives for Infosys and TCS will be held on 4 and 5 September 2026 respectively. Eligible final-year students must upload resumes on the placement portal by 28 August 2026. Eligibility criteria are listed on the portal.",
    summary: "Infosys drive 4 Sep, TCS drive 5 Sep; upload resumes by 28 Aug.",
    aiSummary:
      "On-campus placement drives for Infosys and TCS will be held on 4 and 5 September 2026 respectively. Eligible final-year students must upload resumes on the placement portal by 28 August 2026. Eligibility criteria are listed on the portal.",
    category: "Placement",
    date: "2026-08-05",
    isImportant: true,
    hasAttachment: true,
    postedBy: "Training & Placement Cell",
  },
  {
    id: "nt-05",
    title: "Library Extended Hours During Exams",
    content:
      "The central library will remain open from 7:00 AM to midnight on all working days during the examination season, starting 20 August 2026. The digital reading room will be available 24x7 using your college ID card.",
    summary: "Library open 7 AM – midnight from 20 Aug during exams.",
    aiSummary:
      "The central library will remain open from 7:00 AM to midnight on all working days during the examination season, starting 20 August 2026. The digital reading room will be available 24x7 using your college ID card.",
    category: "General",
    date: "2026-08-03",
    isImportant: false,
    hasAttachment: false,
    postedBy: "Central Library",
  },
  {
    id: "nt-06",
    title: "Workshop — Full Stack with MERN",
    content:
      "The CSE department is organising a two-day hands-on workshop on the MERN stack on 22–23 August 2026, 10:00 AM in the Innovation Lab. Certificates will be issued to all participants. Limited to 60 seats.",
    summary: "MERN workshop 22–23 Aug, 10 AM, Innovation Lab; 60 seats.",
    aiSummary:
      "The CSE department is organising a two-day hands-on workshop on the MERN stack on 22–23 August 2026, 10:00 AM in the Innovation Lab. Certificates will be issued to all participants. Limited to 60 seats.",
    category: "Academic",
    date: "2026-08-01",
    isImportant: false,
    hasAttachment: false,
    postedBy: "Department of CSE",
  },
  {
    id: "nt-07",
    title: "Independence Day Celebration",
    content:
      "The 80th Independence Day will be celebrated on 15 August 2026 at the main ground. The flag hoisting ceremony starts at 8:00 AM. All students are requested to attend in formal attire.",
    summary: "Flag hoisting at main ground on 15 Aug, 8 AM, formal attire.",
    aiSummary:
      "The 80th Independence Day will be celebrated on 15 August 2026 at the main ground. The flag hoisting ceremony starts at 8:00 AM. All students are requested to attend in formal attire.",
    category: "Event",
    date: "2026-07-28",
    isImportant: false,
    hasAttachment: false,
    postedBy: "Students' Activity Centre",
  },
];

export const STUDY_MATERIALS: StudyMaterial[] = [
  { id: "sm-01", name: "DSA Unit 4 — Trees Notes", subjectId: "sub-dsa", category: "Notes", fileType: "PDF", size: "2.4 MB", uploadedBy: "Dr. Anil Mehta", uploadDate: "2026-08-10", downloads: 214 },
  { id: "sm-02", name: "AVL & Red-Black Trees Slides", subjectId: "sub-dsa", category: "Presentations", fileType: "PPTX", size: "8.1 MB", uploadedBy: "Dr. Anil Mehta", uploadDate: "2026-08-08", downloads: 156 },
  { id: "sm-03", name: "DBMS ER Modelling Notes", subjectId: "sub-dbms", category: "Notes", fileType: "PDF", size: "1.8 MB", uploadedBy: "Prof. Rajesh Sharma", uploadDate: "2026-08-06", downloads: 302 },
  { id: "sm-04", name: "SQL Practice Problems", subjectId: "sub-dbms", category: "Assignments", fileType: "DOCX", size: "0.6 MB", uploadedBy: "Prof. Rajesh Sharma", uploadDate: "2026-08-04", downloads: 189 },
  { id: "sm-05", name: "OS — Process Synchronisation Slides", subjectId: "sub-os", category: "Presentations", fileType: "PPTX", size: "5.3 MB", uploadedBy: "Dr. Kavita Iyer", uploadDate: "2026-08-02", downloads: 143 },
  { id: "sm-06", name: "Digital Electronics Mid-Term Paper 2025", subjectId: "sub-de", category: "Previous Year Papers", fileType: "PDF", size: "1.2 MB", uploadedBy: "Prof. Harsh Patel", uploadDate: "2026-07-30", downloads: 421 },
  { id: "sm-07", name: "CN — Layered Architecture Notes", subjectId: "sub-cn", category: "Notes", fileType: "PDF", size: "3.1 MB", uploadedBy: "Dr. Sunil Rao", uploadDate: "2026-07-28", downloads: 96 },
  { id: "sm-08", name: "Probability Distributions Cheat Sheet", subjectId: "sub-math", category: "PDFs", fileType: "PDF", size: "0.9 MB", uploadedBy: "Dr. Pooja Joshi", uploadDate: "2026-07-25", downloads: 337 },
  { id: "sm-09", name: "DSA Lab Manual (Semester 4)", subjectId: "sub-dsa", category: "Assignments", fileType: "ZIP", size: "14.2 MB", uploadedBy: "CS Lab Staff", uploadDate: "2026-07-22", downloads: 178 },
];

export const NOTIFICATIONS: AppNotification[] = [
  { id: "nf-01", type: "exam", title: "DBMS Mid-Term in 10 days", message: "Your DBMS Mid-Term is scheduled for 24 August 2026, 10:00 AM in Room B-204. Review the syllabus for ER Modelling and SQL.", date: "2026-08-14", read: false },
  { id: "nf-02", type: "assignment", title: "AVL Tree Implementation due soon", message: "Assignment 'AVL Tree Implementation' is due in 4 days (18 August). You have not submitted it yet.", date: "2026-08-14", read: false },
  { id: "nf-03", type: "attendance", title: "Digital Electronics below 75%", message: "Your attendance in Digital Electronics is 70% — below the 75% requirement. Attend the next classes to recover.", date: "2026-08-13", read: false },
  { id: "nf-04", type: "notice", title: "Examination form deadline: 28 August", message: "Fill the Summer 2026 examination form before 28 August 2026. Late submissions incur a ₹500 fine.", date: "2026-08-12", read: true },
  { id: "nf-05", type: "general", title: "Library extended hours", message: "Central library stays open until midnight during exams, starting 20 August 2026.", date: "2026-08-11", read: true },
  { id: "nf-06", type: "assignment", title: "OS Assignment deadline extended", message: "The deadline for 'Producer-Consumer Problem' has been extended to 21 August 2026.", date: "2026-08-10", read: true },
  { id: "nf-07", type: "exam", title: "DSA Quiz 3 announced", message: "Quiz 3 on Trees, Heaps and AVL Trees on 19 August 2026, 2:00 PM in Room B-101.", date: "2026-08-09", read: true },
  { id: "nf-08", type: "notice", title: "Placement drive registrations open", message: "Infosys and TCS drives on 4–5 September. Upload resumes on the placement portal by 28 August.", date: "2026-08-08", read: true },
  { id: "nf-09", type: "attendance", title: "Attendance report updated", message: "Your overall attendance for the month of July is 83%. Keep it above 75% in all subjects.", date: "2026-08-01", read: true },
];

export const CONVERSATIONS: Conversation[] = [
  {
    id: "cv-1",
    title: "Exam preparation help",
    createdAt: "2026-08-13T10:24:00",
    updatedAt: "2026-08-13T10:26:00",
    messages: [
      { id: "msg-1", role: "user", content: "When is my next exam?", timestamp: "2026-08-13T10:24:00" },
      {
        id: "msg-2",
        role: "assistant",
        content:
          "Your next exam is the **DBMS Mid-Term** on **24 August 2026** at **10:00 AM** in **Room B-204** — that's in **10 days**.\\n\\nHere's your upcoming exam schedule:\\n\\n• **DSA Quiz 3** — 19 Aug, 2:00 PM, Room B-101\\n• **DBMS Mid-Term** — 24 Aug, 10:00 AM, Room B-204\\n• **OS Unit Test 2** — 28 Aug, 9:00 AM, Room C-102\\n\\nWould you like me to prepare a study plan for the DBMS Mid-Term?",
        timestamp: "2026-08-13T10:24:05",
      },
      { id: "msg-3", role: "user", content: "Yes, please generate a plan.", timestamp: "2026-08-13T10:26:00" },
    ],
  },
  {
    id: "cv-2",
    title: "Attendance warning",
    createdAt: "2026-08-11T15:40:00",
    updatedAt: "2026-08-11T15:41:00",
    messages: [
      { id: "msg-4", role: "user", content: "Am I at risk of being debarred from exams?", timestamp: "2026-08-11T15:40:00" },
      {
        id: "msg-5",
        role: "assistant",
        content:
          "Your **overall attendance is 82%**, which is safe. However, **Digital Electronics** is at **70%** — below the 75% requirement.\\n\\n• **Digital Electronics** — 70% (attend next 3 classes without fail)\\n• **Probability & Statistics** — 76% (just above the limit, stay careful)\\n\\nYou need **4 more classes** in Digital Electronics to reach 75%. Check your attendance page for a full breakdown.",
        timestamp: "2026-08-11T15:40:05",
      },
    ],
  },
];

export const SEED_STUDY_PLAN: StudyPlan = {
  id: "plan-seed-1",
  name: "Exam prep — DBMS · DSA · OS · Digital Electronics · CN · Probability & Stats",
  createdAt: "2026-08-14T08:00:00",
  form: {
    examDates: {
      "sub-dbms": "2026-08-24",
      "sub-dsa": "2026-08-19",
      "sub-os": "2026-08-28",
      "sub-de": "2026-09-02",
      "sub-cn": "2026-09-05",
    },
    availableHours: 3,
    weakSubjects: ["sub-de", "sub-math"],
    preferredTime: "evening",
  },
  slots: [
    { id: "slot-seed-1", day: 5, date: "2026-08-14", startTime: "17:00", endTime: "18:00", subjectId: "sub-dsa", topic: "Trees — BST, traversal, AVL rotations", type: "study" },
    { id: "slot-seed-2", day: 5, date: "2026-08-14", startTime: "18:15", endTime: "19:15", subjectId: "sub-dbms", topic: "ER Modelling & relational algebra", type: "study" },
    { id: "slot-seed-3", day: 5, date: "2026-08-14", startTime: "19:30", endTime: "20:15", subjectId: "sub-dsa", topic: "Revision of today's topics", type: "revision" },
    { id: "slot-seed-4", day: 0, date: "2026-08-16", startTime: "09:00", endTime: "10:00", subjectId: "sub-dbms", topic: "SQL queries — joins, subqueries", type: "study" },
    { id: "slot-seed-5", day: 0, date: "2026-08-16", startTime: "10:15", endTime: "11:15", subjectId: "sub-dsa", topic: "Heap & priority queues", type: "study" },
    { id: "slot-seed-6", day: 0, date: "2026-08-16", startTime: "11:30", endTime: "12:15", subjectId: "sub-dbms", topic: "Revision of today's topics", type: "revision" },
    { id: "slot-seed-7", day: 1, date: "2026-08-17", startTime: "17:00", endTime: "18:00", subjectId: "sub-de", topic: "Boolean algebra & K-maps", type: "study" },
    { id: "slot-seed-8", day: 1, date: "2026-08-17", startTime: "18:15", endTime: "19:15", subjectId: "sub-dbms", topic: "Normalisation up to 3NF", type: "study" },
    { id: "slot-seed-9", day: 1, date: "2026-08-17", startTime: "19:30", endTime: "20:15", subjectId: "sub-de", topic: "Revision of today's topics", type: "revision" },
    { id: "slot-seed-10", day: 2, date: "2026-08-18", startTime: "17:00", endTime: "18:00", subjectId: "sub-de", topic: "Combinational circuits", type: "study" },
    { id: "slot-seed-11", day: 2, date: "2026-08-18", startTime: "18:15", endTime: "19:15", subjectId: "sub-dsa", topic: "AVL trees practice", type: "study" },
    { id: "slot-seed-12", day: 2, date: "2026-08-18", startTime: "19:30", endTime: "20:15", subjectId: "sub-dbms", topic: "Mock quiz — SQL", type: "revision" },
  ],
};
