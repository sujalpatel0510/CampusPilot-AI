import type {
  AppNotification,
  Assignment,
  AttendanceOverview,
  Conversation,
  DashboardData,
  Exam,
  MaterialCategory,
  MaterialFileType,
  Notice,
  StudentProfile,
  StudyMaterial,
  StudyPlan,
  StudyPlanForm,
  Subject,
  TimetableEntry,
  UploadedFileRecord,
} from "@/types";
import {
  ASSIGNMENTS,
  ATTENDANCE,
  CONVERSATIONS,
  EXAMS,
  NOTICES,
  NOTIFICATIONS,
  SEED_STUDY_PLAN,
  STUDENT_PROFILE,
  STUDY_MATERIALS,
  SUBJECTS,
  TIMETABLE,
} from "@/data/mock-data";
import { generateMockResponse, conversationTitle } from "@/lib/mock-ai";
import { generateStudyPlan, planSummary } from "@/lib/planner";
import { addMinutes, DAY_LABELS, uid } from "@/lib/utils";

const LATENCY = 60;
const LATENCY_JITTER = 90;
const SIMULATE_FAILURES = false;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (SIMULATE_FAILURES && Math.random() < 0.12) {
        reject(new Error("Simulated network failure. Please try again."));
      } else {
        resolve(value);
      }
    }, LATENCY + Math.random() * LATENCY_JITTER);
  });
}

let assignmentDb: Assignment[] = [...ASSIGNMENTS];
let examDb: Exam[] = [...EXAMS];
let noticeDb: Notice[] = [...NOTICES];
let materialDb: StudyMaterial[] = [...STUDY_MATERIALS];
let notificationDb: AppNotification[] = [...NOTIFICATIONS];
let conversationDb: Conversation[] = [...CONVERSATIONS];
let studyPlanDb: StudyPlan = { ...SEED_STUDY_PLAN, slots: [...SEED_STUDY_PLAN.slots] };
let noticeUploadsDb: UploadedFileRecord[] = [];

export const api = {
  // ---- Auth ----
  login: (email: string, password: string) =>
    delay<StudentProfile>({
      ...STUDENT_PROFILE,
      ...(email.includes("nitd") ? {} : { email, name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) }),
    }),
  register: (name: string, email: string, course: string, semester: number) =>
    delay<StudentProfile>({ ...STUDENT_PROFILE, name, email, course, semester }),

  // ---- Profile & subjects ----
  getProfile: () => delay<StudentProfile>(STUDENT_PROFILE),
  getSubjects: () => delay<Subject[]>(SUBJECTS),

  // ---- Attendance ----
  getAttendance: () => delay<AttendanceOverview>(ATTENDANCE),

  // ---- Timetable ----
  getTimetable: () => delay<TimetableEntry[]>(TIMETABLE),
  getTodayClasses: () => {
    const now = new Date();
    const day = now.getDay();
    const entries = TIMETABLE.filter((t) => t.day === day);
    const withStatus = entries.map((entry) => {
      const start = new Date();
      const [sh, sm] = entry.startTime.split(":").map(Number);
      start.setHours(sh, sm, 0, 0);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      return {
        ...entry,
        subject: SUBJECTS.find((s) => s.id === entry.subjectId)!,
        status: now < start ? ("upcoming" as const) : now > end ? ("completed" as const) : ("ongoing" as const),
      };
    });
    return delay(withStatus);
  },

  // ---- Dashboard ----
  getDashboardData: () => {
    const data: DashboardData = {
      overallAttendance: ATTENDANCE.overall,
      assignmentsDue: ASSIGNMENTS.filter((a) => a.status === "pending" || a.status === "overdue").length,
      examsUpcoming: EXAMS.filter((e) => !e.completed).length,
      todayClasses: TIMETABLE.filter((t) => t.day === new Date().getDay()).map((entry) => ({
        ...entry,
        subject: SUBJECTS.find((s) => s.id === entry.subjectId)!,
        status: "upcoming" as const,
      })),
      attendance: ATTENDANCE,
      upcomingAssignments: ASSIGNMENTS.filter((a) => a.status !== "completed")
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 4)
        .map((a) => ({ ...a, subject: SUBJECTS.find((s) => s.id === a.subjectId)! })),
      upcomingExams: EXAMS.filter((e) => !e.completed)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 4)
        .map((e) => ({ ...e, subject: SUBJECTS.find((s) => s.id === e.subjectId)! })),
    };
    return delay(data);
  },

  // ---- Assignments ----
  getAssignments: () => delay<Assignment[]>(assignmentDb),
  addAssignment: (input: { subjectId: string; title: string; description?: string; dueDate: string; weightage: number }) => {
    const created: Assignment = {
      id: uid("as"),
      subjectId: input.subjectId,
      title: input.title,
      description: input.description ?? "",
      dueDate: input.dueDate,
      submitted: false,
      status: new Date(input.dueDate) < new Date() ? "overdue" : "pending",
      weightage: input.weightage,
    };
    assignmentDb = [created, ...assignmentDb];
    return delay(created);
  },
  updateAssignmentStatus: (id: string, submitted: boolean) => {
    assignmentDb = assignmentDb.map((a) =>
      a.id === id
        ? {
            ...a,
            submitted,
            status: submitted ? "completed" : new Date(a.dueDate) < new Date() ? "overdue" : "pending",
          }
        : a
    );
    const updated = assignmentDb.find((a) => a.id === id)!;
    return delay(updated);
  },

  // ---- Exams ----
  getExams: () => delay<Exam[]>(examDb),

  // ---- Notices ----
  getNotices: () => delay<Notice[]>(noticeDb),
  uploadNoticeFile: (fileName: string) => {
    const record: UploadedFileRecord = {
      id: uid("up"),
      name: fileName,
      size: `${(Math.random() * 2 + 0.3).toFixed(1)} MB`,
      uploadDate: new Date().toISOString().slice(0, 10),
      status: "processing",
    };
    noticeUploadsDb = [record, ...noticeUploadsDb];
    return delay(record);
  },

  // ---- Study materials ----
  getStudyMaterials: () => delay<StudyMaterial[]>(materialDb),
  uploadStudyMaterial: (input: { name: string; subjectId: string; category: MaterialCategory; fileType: MaterialFileType; size: string }) => {
    const created: StudyMaterial = {
      id: uid("sm"),
      name: input.name,
      subjectId: input.subjectId,
      category: input.category,
      fileType: input.fileType,
      size: input.size,
      uploadedBy: STUDENT_PROFILE.name,
      uploadDate: new Date().toISOString().slice(0, 10),
      downloads: 0,
    };
    materialDb = [created, ...materialDb];
    return delay(created);
  },

  // ---- Notifications ----
  getNotifications: () => delay<AppNotification[]>(notificationDb),
  markNotificationRead: (id: string) => {
    notificationDb = notificationDb.map((n) => (n.id === id ? { ...n, read: true } : n));
    const updated = notificationDb.find((n) => n.id === id)!;
    return delay(updated);
  },
  markAllNotificationsRead: () => {
    notificationDb = notificationDb.map((n) => ({ ...n, read: true }));
    return delay(true);
  },

  // ---- Conversations ----
  getConversations: () => delay<Conversation[]>(conversationDb),
  createConversation: () => {
    const created: Conversation = {
      id: uid("cv"),
      title: "New conversation",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    conversationDb = [created, ...conversationDb];
    return delay(created);
  },
  addMessage: (conversationId: string, role: "user" | "assistant", content: string) => {
    const message = {
      id: uid("msg"),
      role,
      content,
      timestamp: new Date().toISOString(),
    };
    conversationDb = conversationDb.map((c) =>
      c.id === conversationId
        ? { ...c, messages: [...c.messages, message], updatedAt: new Date().toISOString() }
        : c
    );
    if (role === "user" && !content.startsWith("__") && conversationDb.find((c) => c.id === conversationId)?.title === "New conversation") {
      conversationDb = conversationDb.map((c) =>
        c.id === conversationId ? { ...c, title: conversationTitle(content) } : c
      );
    }
    return delay(message);
  },
  deleteConversation: (id: string) => {
    conversationDb = conversationDb.filter((c) => c.id !== id);
    return delay(true);
  },

  getAiReply: async (conversationId: string, userMessage: string) => {
    const context = await api.getDashboardData();
    const reply = generateMockResponse(userMessage, context);
    const [userMsg, aiMsg] = await Promise.all([
      api.addMessage(conversationId, "user", userMessage),
      api.addMessage(conversationId, "assistant", reply),
    ]);
    return { user: userMsg, assistant: aiMsg, reply };
  },

  // ---- Study plan ----
  getStudyPlan: () => delay<StudyPlan>(studyPlanDb),
  generateStudyPlan: (form: StudyPlanForm) => {
    studyPlanDb = generateStudyPlan(form);
    return delay(studyPlanDb);
  },
  planSummaryText: (plan: StudyPlan) => delay<string>(planSummary(plan)),

  // ---- Misc helpers (client-side only, mirrors future endpoints) ----
  getDayLabel: (day: number) => DAY_LABELS[day],
  nowTime: () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  },
  addMinutesTo: (time: string, minutes: number) => addMinutes(time, minutes),
};

export type Api = typeof api;
