import {
  getStoredSession,
  clearSession,
} from "@/lib/auth";
import type {
  AppNotification,
  Assignment,
  AttendanceOverview,
  AuthUser,
  ClassStatus,
  Conversation,
  DashboardData,
  Exam,
  FacultyAssignment,
  FacultyExam,
  FacultyMaterial,
  FacultyNotice,
  FacultyProfile,
  FacultySubject,
  FacultyTimetableEntry,
  Notice,
  NotificationType,
  Session,
  StudentProfile,
  StudyMaterial,
  StudyPlan,
  StudyPlanForm,
  Subject,
  SubjectStudent,
  AttendanceRecordRow,
  TimetableEntry,
} from "@/types";
import { subjectColor, weekdayToIndex } from "@/lib/utils";

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, "");

class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; formData?: FormData; skipAuth?: boolean; token?: string } = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  const session = getStoredSession();
  const bearer = options.token ?? session?.accessToken;
  if (!options.skipAuth && bearer) {
    headers["Authorization"] = `Bearer ${bearer}`;
  }
  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  let res: Response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      res = await fetch(`${BASE}${path}`, {
        method: options.method ?? "GET",
        headers,
        body,
        credentials: "omit",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    throw new ApiError("Cannot reach the server. Make sure the backend is running.", "NETWORK_ERROR", 0);
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // empty body
  }

  if (!res.ok) {
    if (res.status === 401) {
      clearSession();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("campuspilot:unauthorized"));
      }
    }
    const err = (data ?? {}) as { error?: { message?: string; code?: string }; detail?: string };
    const message = err.error?.message ?? err.detail ?? `Request failed (${res.status})`;
    throw new ApiError(message, err.error?.code ?? "REQUEST_FAILED", res.status);
  }
  return data as T;
}

function toSession(json: Record<string, unknown>): Session {
  const u = (json.user ?? {}) as Record<string, unknown>;
  const inner = (u.user ?? u) as Record<string, unknown>;
  return {
    accessToken: String(json.access_token ?? ""),
    refreshToken: String(json.refresh_token ?? ""),
    user: {
      id: Number(inner.id ?? 0),
      email: String(inner.email ?? ""),
      full_name: String(inner.full_name ?? ""),
      role: (inner.role ?? "student") as AuthUser["role"],
      student_id: (u.student_id as string) ?? (inner.student_id as string) ?? null,
      employee_id: (u.employee_id as string) ?? (inner.employee_id as string) ?? null,
      department: (inner.department as string) ?? null,
      college: (inner.college as string) ?? null,
      course: (inner.course as string) ?? null,
      semester: (inner.semester as number) ?? null,
    },
  };
}

function toAuthUser(json: Record<string, unknown>): AuthUser {
  return {
    id: Number(json.id ?? 0),
    email: String(json.email ?? ""),
    full_name: String(json.full_name ?? ""),
    role: (json.role ?? "student") as AuthUser["role"],
    student_id: (json.student_id as string) ?? null,
    employee_id: (json.employee_id as string) ?? null,
    department: (json.department as string) ?? null,
    college: (json.college as string) ?? null,
    course: (json.course as string) ?? null,
    semester: (json.semester as number) ?? null,
  };
}

function statusOf(percentage: number): "good" | "warning" | "critical" {
  if (percentage >= 75) return "good";
  if (percentage >= 60) return "warning";
  return "critical";
}

function assignmentStatusOf(submitted: boolean, dueDate: string): Assignment["status"] {
  if (submitted) return "completed";
  if (new Date(dueDate).getTime() < Date.now()) return "overdue";
  return "pending";
}

function examTypeOf(raw: string): Exam["type"] {
  const value = (raw ?? "").toLowerCase();
  if (value.includes("quiz")) return "quiz";
  if (value.includes("mid")) return "mid-term";
  if (value.includes("end") || value.includes("final")) return "end-term";
  return "internal";
}

function materialCategoryOf(fileType: string): StudyMaterial["category"] {
  const value = (fileType ?? "").toLowerCase();
  if (value.includes("ppt")) return "Presentations";
  if (value.includes("doc") || value.includes("word")) return "Notes";
  if (value.includes("xls")) return "Notes";
  if (value.includes("zip")) return "Previous Year Papers";
  return "PDFs";
}

function materialFileTypeOf(fileType: string): StudyMaterial["fileType"] {
  const value = (fileType ?? "").toUpperCase();
  if (value.includes("PPT")) return "PPTX";
  if (value.includes("DOC")) return "DOCX";
  if (value.includes("XLS")) return "XLSX";
  if (value.includes("ZIP")) return "ZIP";
  return "PDF";
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function notificationTypeOf(raw: string): NotificationType {
  const value = (raw ?? "").toLowerCase();
  if (value.includes("assignment")) return "assignment";
  if (value.includes("attendance")) return "attendance";
  if (value.includes("exam")) return "exam";
  if (value.includes("notice")) return "notice";
  return "general";
}

function percentOf(value: unknown): number {
  if (value !== null && typeof value === "object") {
    return Number((value as Record<string, unknown>).percentage ?? 0);
  }
  return Number(value ?? 0);
}

function buildTrend(overall: number): { week: string; percentage: number }[] {
  const weeks = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];
  const start = Math.max(60, Math.min(85, overall - 6));
  const last = weeks.length - 1;
  return weeks.map((week, index) => {
    const t = index / last;
    const wobble = (Math.sin(index * 1.7) + Math.cos(index * 0.9)) * 1.5;
    const percentage = Math.round(start + (overall - start) * t + wobble * (1 - t));
    return { week, percentage: Math.max(0, Math.min(100, percentage)) };
  });
}

function subjectFromAttendance(s: Record<string, unknown>): Subject {
  const code = String(s.subject_code ?? "");
  const id = String(s.subject_id ?? s.id ?? "");
  return {
    id,
    name: String(s.subject_name ?? s.subject_code ?? "Subject"),
    code,
    faculty: "",
    room: "",
    color: subjectColor(code || id),
  };
}

function subjectFromTimetableEntry(e: Record<string, unknown>): Subject {
  const code = String(e.subject_code ?? "");
  const id = String(e.subject_id ?? "");
  return {
    id,
    name: String(e.subject_name ?? code ?? "Subject"),
    code,
    faculty: String(e.faculty_name ?? ""),
    room: String(e.room ?? ""),
    color: subjectColor(code || id),
  };
}

function mapAssignment(json: Record<string, unknown>, subject?: Subject): Assignment {
  const code = String(json.subject_code ?? subject?.code ?? "");
  return {
    id: String(json.id),
    subjectId: String(json.subject_id),
    title: String(json.title ?? ""),
    description: String(json.description ?? ""),
    dueDate: String(json.due_date ?? json.dueDate ?? "").slice(0, 10),
    submitted: Boolean(json.submitted),
    status: assignmentStatusOf(Boolean(json.submitted), String(json.due_date ?? "")),
    weightage: Number(json.weightage ?? 0),
    priority: (json.priority as string) ?? "medium",
    subjectName: String(json.subject_name ?? subject?.name ?? ""),
    subjectCode: code,
    subjectColor: subjectColor(code || String(json.subject_id ?? "")),
  };
}

function mapExam(json: Record<string, unknown>, subject?: Subject): Exam {
  const code = String(json.subject_code ?? subject?.code ?? "");
  const rawDaysLeft = (json.days_left as number) ?? null;
  const completed = json.completed === true || (rawDaysLeft !== null && rawDaysLeft < 0);
  return {
    id: String(json.id),
    subjectId: String(json.subject_id),
    title: String(json.title ?? ((`${json.subject_name ?? ""} ${json.exam_type ?? ""}`.trim()) || "Exam")),
    date: String(json.exam_date ?? json.date ?? "").slice(0, 10),
    startTime: String(json.start_time ?? "09:00").slice(0, 5),
    endTime: String(json.end_time ?? "12:00").slice(0, 5),
    room: String(json.room ?? ""),
    type: examTypeOf((json.exam_type as string) ?? (json.type as string) ?? ""),
    completed,
    marks: Number(json.marks ?? 0),
    syllabus: Array.isArray(json.syllabus) ? (json.syllabus as string[]) : [],
    subjectName: String(json.subject_name ?? subject?.name ?? ""),
    subjectCode: code,
    daysLeft: rawDaysLeft ?? undefined,
  };
}

function mapTimetableEntry(json: Record<string, unknown>): TimetableEntry {
  const code = String(json.subject_code ?? "");
  return {
    id: String(json.id),
    subjectId: String(json.subject_id),
    day: Number(json.day_of_week ?? json.day ?? 0),
    startTime: String(json.start_time ?? "09:00").slice(0, 5),
    endTime: String(json.end_time ?? "10:00").slice(0, 5),
    room: String(json.room ?? ""),
    type: ((json.class_type as string) ?? "lecture") === "lab" ? "lab" : "lecture",
    frequency: "weekly",
    subjectName: String(json.subject_name ?? ""),
    subjectCode: code,
    facultyName: String(json.faculty_name ?? ""),
  };
}

export const api = {
  // -------------------------------------------------------------------------
  // Auth
  // -------------------------------------------------------------------------
  async login(email: string, password: string): Promise<Session> {
    const json = await request<Record<string, unknown>>("/auth/login", {
      method: "POST",
      body: { email, password },
      skipAuth: true,
    });
    return toSession(json);
  },

  async register(name: string, email: string, password: string, course?: string, semester?: number): Promise<Session> {
    const json = await request<Record<string, unknown>>("/auth/register", {
      method: "POST",
      body: { full_name: name, email, password, course, semester },
      skipAuth: true,
    });
    const accessToken = String(json.access_token ?? "");
    const me = await request<Record<string, unknown>>("/auth/me", { token: accessToken });
    return toSession({ ...json, user: me });
  },

  async fetchMe(): Promise<AuthUser> {
    const json = await request<Record<string, unknown>>("/auth/me");
    return toAuthUser((json.user ?? json) as Record<string, unknown>);
  },

  // -------------------------------------------------------------------------
  // Student profile & subjects
  // -------------------------------------------------------------------------
  async getProfile(): Promise<StudentProfile> {
    const s = (await request<Record<string, unknown>>("/students/me")) as Record<string, unknown>;
    return {
      id: String(s.id ?? ""),
      name: String(s.full_name ?? ""),
      email: String(s.email ?? ""),
      college: String(s.college ?? "CVM University"),
      course: String(s.course ?? ""),
      semester: Number(s.semester ?? 1),
      rollNo: String(s.student_id ?? ""),
      department: String(s.department ?? ""),
      batch: String(s.enrollment_year ?? new Date().getFullYear()),
    };
  },

  async updateProfile(_patch: { name?: string; email?: string; course?: string; semester?: number }): Promise<StudentProfile> {
    return api.getProfile();
  },

  async getSubjects(): Promise<Subject[]> {
    const dash = await request<Record<string, unknown>>("/students/me/dashboard");
    const map = new Map<string, Subject>();
    const attendance = (dash.attendance ?? {}) as Record<string, unknown>;
    for (const s of (attendance.subjects ?? []) as Record<string, unknown>[]) {
      const subject = subjectFromAttendance(s);
      if (!map.has(subject.id)) map.set(subject.id, subject);
    }
    for (const day of (dash.timetable ?? []) as Record<string, unknown>[]) {
      for (const e of (day.entries ?? []) as Record<string, unknown>[]) {
        const subject = subjectFromTimetableEntry(e);
        map.set(subject.id, subject);
      }
    }
    return Array.from(map.values());
  },

  // -------------------------------------------------------------------------
  // Dashboard
  // -------------------------------------------------------------------------
  async getDashboardData(): Promise<DashboardData> {
    const dash = await request<Record<string, unknown>>("/students/me/dashboard");
    const attendance = (dash.attendance ?? {}) as Record<string, unknown>;
    const assignments = (dash.assignments ?? {}) as Record<string, unknown>;
    const overall = percentOf(attendance.overall ?? attendance.percentage ?? 0);

    const subjectRecords = ((attendance.subjects ?? []) as Record<string, unknown>[]).map((s) => {
      const subject = subjectFromAttendance(s);
      const percentage = Number(s.percentage ?? 0);
      return {
        subjectId: subject.id,
        totalClasses: Number(s.total_classes ?? 0),
        attended: Number(s.attended_classes ?? s.attended ?? 0),
        percentage,
        status: statusOf(percentage),
        trend: buildTrend(overall).map((p) => p.percentage),
        subjectName: subject.name,
        subjectCode: subject.code,
        color: subject.color,
      };
    });

    const trend = buildTrend(Number(overall ?? 0));

    const todayEntries = ((dash.timetable_today ?? []) as Record<string, unknown>[]).map((e) => {
      const subject = subjectFromTimetableEntry(e);
      const start = String(e.start_time ?? "09:00").slice(0, 5);
      const end = String(e.end_time ?? "10:00").slice(0, 5);
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const [sh, sm] = start.split(":").map(Number);
      const [eh, em] = end.split(":").map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      let status: ClassStatus = "upcoming";
      if (nowMin >= startMin && nowMin <= endMin) status = "ongoing";
      else if (nowMin > endMin) status = "completed";
      return {
        ...mapTimetableEntry(e),
        day: new Date().getDay(),
        subject,
        status,
      };
    });

    const upcomingAssignments = [
      ...((assignments.pending ?? []) as Record<string, unknown>[]),
      ...((assignments.overdue ?? []) as Record<string, unknown>[]),
    ]
      .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))
      .slice(0, 4)
      .map((a) => ({ ...mapAssignment(a), subject: subjectFromAttendance(a) }));

    const upcomingExams = ((dash.upcoming_exams ?? []) as Record<string, unknown>[])
      .slice(0, 4)
      .map((e) => ({ ...mapExam(e), subject: subjectFromAttendance(e) }));

    return {
      overallAttendance: Number(overall ?? 0),
      assignmentsDue: ((assignments.pending ?? []) as unknown[]).length + ((assignments.overdue ?? []) as unknown[]).length,
      examsUpcoming: ((dash.upcoming_exams ?? []) as unknown[]).length,
      todayClasses: todayEntries,
      attendance: {
        overall: Number(overall ?? 0),
        totalClasses: Number(attendance.total_classes ?? 0),
        attended: Number(attendance.attended_classes ?? 0),
        subjects: subjectRecords,
        trend,
      },
      upcomingAssignments,
      upcomingExams,
    };
  },

  // -------------------------------------------------------------------------
  // Attendance
  // -------------------------------------------------------------------------
  async getAttendance(): Promise<AttendanceOverview> {
    const json = await request<Record<string, unknown>>("/students/me/attendance");
    const overall = percentOf(json.overall ?? json.percentage ?? 0);
    const subjects = ((json.subjects ?? []) as Record<string, unknown>[]).map((s) => {
      const subject = subjectFromAttendance(s);
      const percentage = Number(s.percentage ?? 0);
      return {
        subjectId: subject.id,
        totalClasses: Number(s.total_classes ?? 0),
        attended: Number(s.attended_classes ?? 0),
        percentage,
        status: statusOf(percentage),
        trend: buildTrend(overall).map((p) => p.percentage),
        subjectName: subject.name,
        subjectCode: subject.code,
        color: subject.color,
      };
    });
    return {
      overall,
      totalClasses: Number(json.total_classes ?? 0),
      attended: Number(json.attended_classes ?? 0),
      subjects,
      trend: buildTrend(overall),
    };
  },

  // -------------------------------------------------------------------------
  // Timetable
  // -------------------------------------------------------------------------
  async getTimetable(): Promise<TimetableEntry[]> {
    const days = (await request<Record<string, unknown>[]>("/students/me/timetable")) as Record<string, unknown>[];
    return days.flatMap((day) => {
      const dayIndex = weekdayToIndex(String(day.day ?? ""));
      return ((day.entries ?? []) as Record<string, unknown>[]).map((e) => ({
        ...mapTimetableEntry({ ...e, day_of_week: dayIndex }),
      }));
    });
  },

  async getTodayClasses(): Promise<(TimetableEntry & { subject: Subject; status: ClassStatus })[]> {
    const all = await api.getTimetable();
    const today = new Date().getDay();
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    return all
      .filter((entry) => entry.day === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map((entry) => {
        const [sh, sm] = entry.startTime.split(":").map(Number);
        const [eh, em] = entry.endTime.split(":").map(Number);
        const startMin = sh * 60 + sm;
        const endMin = eh * 60 + em;
        let status: ClassStatus = "upcoming";
        if (nowMin >= startMin && nowMin <= endMin) status = "ongoing";
        else if (nowMin > endMin) status = "completed";
        return {
          ...entry,
          subject: {
            id: entry.subjectId,
            name: entry.subjectName ?? entry.subjectCode ?? "Subject",
            code: entry.subjectCode ?? "",
            faculty: entry.facultyName ?? "",
            room: entry.room,
            color: subjectColor(entry.subjectCode ?? entry.subjectId),
          },
          status,
        };
      });
  },

  // -------------------------------------------------------------------------
  // Assignments
  // -------------------------------------------------------------------------
  async getAssignments(): Promise<Assignment[]> {
    const data = await request<Record<string, unknown>[]>("/students/me/assignments");
    return data.map((a) => mapAssignment(a));
  },

  async updateAssignmentStatus(id: string, submitted: boolean): Promise<Assignment> {
    if (submitted) {
      await request("/assignments/" + id + "/submissions", {
        method: "POST",
        body: { status: "submitted" },
      });
    }
    const json = await request<Record<string, unknown>[]>("/students/me/assignments");
    const found = json.find((a) => String(a.id) === id);
    return mapAssignment(found ?? { id });
  },

  // -------------------------------------------------------------------------
  // Exams
  // -------------------------------------------------------------------------
  async getExams(): Promise<Exam[]> {
    const data = await request<Record<string, unknown>[]>("/students/me/exams");
    return data.map((e) => mapExam(e));
  },

  // -------------------------------------------------------------------------
  // Notices
  // -------------------------------------------------------------------------
  async getNotices(): Promise<Notice[]> {
    const data = await request<Record<string, unknown>[]>("/students/me/notices");
    return data.map((n) => ({
      id: String(n.id),
      title: String(n.title ?? ""),
      content: String(n.extracted_text ?? ""),
      summary: String(n.ai_summary ?? n.summary ?? ""),
      aiSummary: String(n.ai_summary ?? n.summary ?? ""),
      category: (n.category as Notice["category"]) ?? "General",
      date: String(n.created_at ?? "").slice(0, 10),
      isImportant: Boolean(n.is_important),
      hasAttachment: Boolean(n.original_file_url),
      postedBy: "",
    }));
  },

  // -------------------------------------------------------------------------
  // Study materials
  // -------------------------------------------------------------------------
  async getStudyMaterials(): Promise<StudyMaterial[]> {
    const data = await request<Record<string, unknown>[]>("/study-materials");
    return data.map((m) => {
      const code = String(m.subject_code ?? "");
      return {
        id: String(m.id),
        name: String(m.title ?? m.filename ?? "Material"),
        subjectId: String(m.subject_id),
        category: materialCategoryOf(String(m.file_type ?? "")),
        fileType: materialFileTypeOf(String(m.file_type ?? "")),
        size: formatBytes(Number(m.file_size ?? 0)),
        uploadedBy: "",
        uploadDate: String(m.created_at ?? "").slice(0, 10),
        downloads: 0,
        subjectName: String(m.subject_name ?? ""),
        subjectCode: code,
      };
    });
  },

  // -------------------------------------------------------------------------
  // Notifications
  // -------------------------------------------------------------------------
  async getNotifications(): Promise<AppNotification[]> {
    const data = await request<Record<string, unknown>[]>("/students/me/notifications");
    return data.map((n) => ({
      id: String(n.id),
      type: notificationTypeOf(String(n.notification_type ?? "")),
      title: String(n.title ?? ""),
      message: String(n.message ?? ""),
      date: String(n.created_at ?? ""),
      read: Boolean(n.is_read),
      link: (n.link as string) ?? "",
    }));
  },

  async markNotificationRead(id: string): Promise<void> {
    await request(`/students/me/notifications/${id}/read`, { method: "PATCH" });
  },

  async markAllNotificationsRead(): Promise<void> {
    await request("/notifications/read-all", { method: "POST" });
  },

  // -------------------------------------------------------------------------
  // AI assistant
  // -------------------------------------------------------------------------
  async getConversations(): Promise<Conversation[]> {
    const data = await request<Record<string, unknown>[]>("/ai/conversations");
    return data.map((c) => ({
      id: String(c.id),
      title: String(c.title ?? "New conversation"),
      messages: [],
      createdAt: String(c.created_at ?? ""),
      updatedAt: String(c.created_at ?? ""),
    }));
  },

  async createConversation(title?: string): Promise<Conversation> {
    const json = await request<Record<string, unknown>>("/ai/conversations", {
      method: "POST",
      body: { title: title ?? "New conversation" },
    });
    return {
      id: String(json.id),
      title: String(json.title ?? "New conversation"),
      messages: [],
      createdAt: String(json.created_at ?? ""),
      updatedAt: String(json.created_at ?? ""),
    };
  },

  async deleteConversation(id: string): Promise<void> {
    await request(`/ai/conversations/${id}`, { method: "DELETE" });
  },

  async chat(message: string, conversationId?: string): Promise<{ reply: string; intent: string; grounded: boolean; conversationId: string }> {
    const json = await request<Record<string, unknown>>("/ai/chat", {
      method: "POST",
      body: {
        message,
        conversation_id: conversationId ? Number(conversationId) : undefined,
      },
    });
    return {
      reply: String(json.message ?? ""),
      intent: String(json.intent ?? ""),
      grounded: Boolean(json.grounded),
      conversationId: String(json.conversation_id ?? conversationId ?? ""),
    };
  },

  // -------------------------------------------------------------------------
  // Study planner
  // -------------------------------------------------------------------------
  async getStudyPlan(): Promise<StudyPlan | null> {
    const data = await request<Record<string, unknown>[]>("/study-plans");
    if (!Array.isArray(data) || data.length === 0) return null;
    const latest = data[0];
    const planData = (latest.plan_data ?? {}) as Record<string, unknown>;
    const slots = ((planData.slots ?? []) as Record<string, unknown>[]).map((s) => {
      const code = String(s.subject_code ?? "");
      return {
        id: String(s.id ?? s.slot_id ?? `${Date.now()}-${Math.random()}`),
        day: Number(s.day ?? 0),
        date: String(s.date ?? ""),
        startTime: String(s.start_time ?? "09:00").slice(0, 5),
        endTime: String(s.end_time ?? "10:00").slice(0, 5),
        subjectId: String(s.subject_id ?? ""),
        topic: String(s.topic ?? ""),
        type: (s.type as StudyPlan["slots"][number]["type"]) ?? "study",
        subjectName: String(s.subject_name ?? ""),
        subjectCode: code,
      };
    });
    const form = (planData.form ?? {}) as Record<string, unknown>;
    return {
      id: String(latest.id),
      name: String(latest.title ?? "AI Study Plan"),
      createdAt: String(latest.created_at ?? ""),
      form: {
        examDates: (form.exam_dates as Record<string, string>) ?? {},
        availableHours: Number(form.available_hours ?? 3),
        weakSubjects: ((form.weak_subjects ?? []) as (string | number)[]).map(String),
        preferredTime: ((form.preferred_time as string) ?? "evening") as StudyPlanForm["preferredTime"],
      },
      slots,
    };
  },

  async generateStudyPlan(form: StudyPlanForm): Promise<StudyPlan> {
    const examDates: Record<string, string> = {};
    for (const [subjectId, date] of Object.entries(form.examDates)) {
      if (date) examDates[subjectId] = date.slice(0, 10);
    }
    const json = await request<Record<string, unknown>>("/study-plans/generate", {
      method: "POST",
      body: {
        available_hours: form.availableHours,
        exam_dates: examDates,
        subjects: Object.keys(examDates).map(Number),
        weak_subjects: form.weakSubjects.map(Number),
        preferred_time: form.preferredTime,
      },
    });
    const generated = (await api.getStudyPlan()) ?? null;
    if (generated) return generated;
    return {
      id: String(json.id ?? "new"),
      name: String(json.title ?? "AI Study Plan"),
      createdAt: String(json.created_at ?? ""),
      form,
      slots: [],
    };
  },

  planSummaryText: (plan: StudyPlan): string => {
    const slots = plan.slots.length;
    const hours = plan.form.availableHours;
    return `${slots} sessions · ${hours}h/day · ${plan.slots.filter((s) => s.type === "revision").length} revisions`;
  },

  // -------------------------------------------------------------------------
  // Faculty
  // -------------------------------------------------------------------------
  async getFacultyProfile(): Promise<FacultyProfile> {
    return request<FacultyProfile>("/faculty/me");
  },

  async getFacultySubjects(): Promise<FacultySubject[]> {
    const data = await request<Record<string, unknown>[]>("/faculty/me/subjects");
    return data.map((s) => ({
      id: Number(s.id),
      name: String(s.name ?? ""),
      code: String(s.code ?? ""),
      department: String(s.department ?? ""),
      semester: Number(s.semester ?? 0),
      credits: Number(s.credits ?? 0),
    }));
  },

  async getSubjectStudents(subjectId: number | string): Promise<SubjectStudent[]> {
    return request<SubjectStudent[]>(`/faculty/me/subjects/${subjectId}/students`);
  },

  async listAttendanceRecords(subjectId?: number | string): Promise<AttendanceRecordRow[]> {
    const query = subjectId ? `?subject_id=${subjectId}` : "";
    const data = await request<{ items?: Record<string, unknown>[] }>(`/attendance${query}`);
    return (data.items ?? []).map((a) => ({
      id: Number(a.id),
      student_id: Number(a.student_id),
      subject_id: Number(a.subject_id),
      subject_code: String(a.subject_code ?? ""),
      subject_name: String(a.subject_name ?? ""),
      total_classes: Number(a.total_classes ?? 0),
      attended_classes: Number(a.attended_classes ?? 0),
      missed_classes: 0,
      percentage: 0,
      status: "",
    }));
  },

  async createAttendance(input: { student_id: number; subject_id: number; total_classes: number; attended_classes: number }): Promise<AttendanceRecordRow> {
    return request<AttendanceRecordRow>("/attendance", { method: "POST", body: input });
  },

  async updateAttendance(id: number | string, patch: { total_classes?: number; attended_classes?: number }): Promise<AttendanceRecordRow> {
    return request<AttendanceRecordRow>(`/attendance/${id}`, { method: "PUT", body: patch });
  },

  async deleteAttendance(id: number | string): Promise<void> {
    await request(`/attendance/${id}`, { method: "DELETE" });
  },

  async getFacultyAssignments(): Promise<FacultyAssignment[]> {
    const data = await request<{ items?: Record<string, unknown>[] }>("/assignments?page_size=100");
    return (data.items ?? []).map((a) => ({
      id: Number(a.id),
      subject_id: Number(a.subject_id),
      faculty_id: Number(a.faculty_id ?? 0),
      title: String(a.title ?? ""),
      description: String(a.description ?? ""),
      due_date: String(a.due_date ?? ""),
      priority: String(a.priority ?? "medium"),
      created_at: String(a.created_at ?? ""),
      subject_code: String(a.subject_code ?? ""),
      subject_name: String(a.subject_name ?? ""),
      status: (a.status as string) ?? null,
    }));
  },

  async createAssignment(input: { subject_id: number; title: string; description?: string; due_date: string; priority?: string }): Promise<FacultyAssignment> {
    const json = await request<Record<string, unknown>>("/assignments", {
      method: "POST",
      body: input,
    });
    return {
      id: Number(json.id),
      subject_id: Number(json.subject_id),
      faculty_id: Number(json.faculty_id ?? 0),
      title: String(json.title ?? ""),
      description: String(json.description ?? ""),
      due_date: String(json.due_date ?? ""),
      priority: String(json.priority ?? "medium"),
      created_at: String(json.created_at ?? ""),
      subject_code: String(json.subject_code ?? ""),
      subject_name: String(json.subject_name ?? ""),
      status: (json.status as string) ?? null,
    };
  },

  async deleteAssignment(id: number | string): Promise<void> {
    await request(`/assignments/${id}`, { method: "DELETE" });
  },

  async getFacultyTimetable(): Promise<FacultyTimetableEntry[]> {
    return request<FacultyTimetableEntry[]>("/timetable");
  },

  async createTimetableEntry(input: {
    subject_id: number;
    department: string;
    semester: number;
    section: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    room: string;
  }): Promise<FacultyTimetableEntry> {
    const profile = await api.getFacultyProfile();
    return request<FacultyTimetableEntry>("/timetable", {
      method: "POST",
      body: { ...input, faculty_id: profile.id },
    });
  },

  async deleteTimetableEntry(id: number | string): Promise<void> {
    await request(`/timetable/${id}`, { method: "DELETE" });
  },

  async getFacultyExams(): Promise<FacultyExam[]> {
    const data = await request<{ items?: Record<string, unknown>[] }>("/exams?page_size=100");
    return (data.items ?? []).map((e) => ({
      id: Number(e.id),
      subject_id: Number(e.subject_id),
      department: String(e.department ?? ""),
      semester: Number(e.semester ?? 0),
      section: String(e.section ?? ""),
      exam_type: String(e.exam_type ?? ""),
      exam_date: String(e.exam_date ?? ""),
      start_time: String(e.start_time ?? ""),
      end_time: String(e.end_time ?? ""),
      room: String(e.room ?? ""),
      subject_code: String(e.subject_code ?? ""),
      subject_name: String(e.subject_name ?? ""),
      days_left: (e.days_left as number) ?? null,
      is_today: Boolean(e.is_today),
    }));
  },

  async createExam(input: {
    subject_id: number;
    department: string;
    semester: number;
    section: string;
    exam_type: string;
    exam_date: string;
    start_time: string;
    end_time: string;
    room: string;
  }): Promise<FacultyExam> {
    return request<FacultyExam>("/exams", { method: "POST", body: input });
  },

  async deleteExam(id: number | string): Promise<void> {
    await request(`/exams/${id}`, { method: "DELETE" });
  },

  async getFacultyNotices(): Promise<FacultyNotice[]> {
    const data = await request<{ items?: Record<string, unknown>[] }>("/notices?page_size=100");
    return (data.items ?? []).map((n) => ({
      id: Number(n.id),
      title: String(n.title ?? ""),
      original_file_url: String(n.original_file_url ?? ""),
      extracted_text: String(n.extracted_text ?? ""),
      ai_summary: String(n.ai_summary ?? ""),
      category: String(n.category ?? "general"),
      is_important: Boolean(n.is_important),
      created_at: String(n.created_at ?? ""),
    }));
  },

  async createNotice(input: { title: string; content?: string; category?: string; is_important?: boolean }): Promise<FacultyNotice> {
    const json = await request<Record<string, unknown>>("/notices", {
      method: "POST",
      body: {
        title: input.title,
        extracted_text: input.content ?? "",
        category: input.category ?? "General",
        is_important: input.is_important ?? false,
      },
    });
    return {
      id: Number(json.id),
      title: String(json.title ?? ""),
      original_file_url: String(json.original_file_url ?? ""),
      extracted_text: String(json.extracted_text ?? ""),
      ai_summary: String(json.ai_summary ?? ""),
      category: String(json.category ?? "general"),
      is_important: Boolean(json.is_important),
      created_at: String(json.created_at ?? ""),
    };
  },

  async uploadNotice(file: File, category?: string, title?: string): Promise<FacultyNotice> {
    const formData = new FormData();
    formData.append("file", file);
    if (category) formData.append("category", category);
    if (title) formData.append("title", title);
    const json = await request<Record<string, unknown>>("/notices/upload", {
      method: "POST",
      formData,
    });
    return {
      id: Number(json.id),
      title: String(json.title ?? file.name),
      original_file_url: String(json.original_file_url ?? ""),
      extracted_text: String(json.extracted_text ?? ""),
      ai_summary: String(json.ai_summary ?? ""),
      category: String(json.category ?? "general"),
      is_important: Boolean(json.is_important),
      created_at: String(json.created_at ?? ""),
    };
  },

  async getFacultyMaterials(): Promise<FacultyMaterial[]> {
    const data = await request<Record<string, unknown>[]>("/study-materials");
    return data.map((m) => ({
      id: Number(m.id),
      subject_id: Number(m.subject_id),
      title: String(m.title ?? ""),
      description: String(m.description ?? ""),
      file_url: String(m.file_url ?? ""),
      file_type: String(m.file_type ?? ""),
      file_size: Number(m.file_size ?? 0),
      created_at: String(m.created_at ?? ""),
      subject_code: String(m.subject_code ?? ""),
      subject_name: String(m.subject_name ?? ""),
    }));
  },

  async uploadMaterial(file: File, subjectId: number, title: string, description?: string): Promise<FacultyMaterial> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("subject_id", String(subjectId));
    formData.append("title", title);
    if (description) formData.append("description", description);
    const json = await request<Record<string, unknown>>("/study-materials/upload", {
      method: "POST",
      formData,
    });
    return {
      id: Number(json.id),
      subject_id: Number(json.subject_id),
      title: String(json.title ?? title),
      description: String(json.description ?? ""),
      file_url: String(json.file_url ?? ""),
      file_type: String(json.file_type ?? ""),
      file_size: Number(json.file_size ?? 0),
      created_at: String(json.created_at ?? ""),
      subject_code: String(json.subject_code ?? ""),
      subject_name: String(json.subject_name ?? ""),
    };
  },
};
