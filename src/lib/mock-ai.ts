import type { DashboardData } from "@/types";
import { formatDate, formatTime12, daysUntil } from "@/lib/utils";

const WEAK_SUBJECTS = ["sub-de", "sub-math"];

function listExams(data: DashboardData, limit = 4): string {
  const upcoming = data.upcomingExams.slice(0, limit);
  if (upcoming.length === 0) return "You have no upcoming exams. Enjoy the break!";
  return upcoming
    .map((e) => `• **${e.subject.name}** — ${e.title} on **${formatDate(e.date)}** at **${formatTime12(e.startTime)}** (Room ${e.room})`)
    .join("\n");
}

function listAssignments(data: DashboardData, limit = 4): string {
  const items = data.upcomingAssignments.slice(0, limit);
  if (items.length === 0) return "No pending assignments. Nice work!";
  return items
    .map((a) => `• **${a.title}** (${a.subject.name}) — due **${formatDate(a.dueDate)}**`)
    .join("\n");
}

function listAttendance(data: DashboardData): string {
  const rows = data.attendance.subjects
    .slice()
    .sort((a, b) => a.percentage - b.percentage)
    .map((s) => {
      const name = s.subjectId === "sub-de" ? "**Digital Electronics**" : s.subjectId === "sub-math" ? "**Probability & Statistics**" : s.subjectId;
      return `• ${name} — **${s.percentage}%** (${s.attended}/${s.totalClasses} classes)`;
    });
  return rows.join("\n");
}

export function generateMockResponse(query: string, data: DashboardData): string {
  const q = query.toLowerCase();

  if (/^(hi|hello|hey|yo|namaste)\b/.test(q)) {
    return `Hello! I'm your CampusPilot AI assistant. I can help you with:\n\n• **Exams** — schedules, syllabus, countdowns\n• **Attendance** — current status and warnings\n• **Classes** — today's timetable\n• **Assignments** — deadlines and status\n• **Notices** — latest official announcements\n• **Study plans** — personalised revision plans\n\nWhat would you like to know?`;
  }

  if (/(exam|test|quiz|mid|end-term|end term|syllabus)/.test(q)) {
    return `Here's your upcoming exam schedule:\n\n${listExams(data)}\n\n**Next exam:** ${data.upcomingExams[0]?.title ?? "—"} on **${formatDate(data.upcomingExams[0]?.date ?? "")}**, that's **${daysUntil(data.upcomingExams[0]?.date ?? "")} days away**.\\n\\nWould you like me to generate a study plan for it?`;
  }

  if (/(attendance|present|absent|debar|75)/.test(q)) {
    const warning = data.attendance.subjects.filter((s) => s.percentage < 75);
    const caution = data.attendance.subjects.filter((s) => s.percentage < 80 && s.percentage >= 75);
    let extra = "";
    if (warning.length > 0) {
      extra = `\\n\\n**Warning:** ${warning.length} subject(s) below 75% — you could be debarred from exams. Attend classes immediately.`;
    }
    if (caution.length > 0) {
      extra += `\\n\\n**Caution:** ${caution.length} subject(s) close to the limit. Keep an eye on them.`;
    }
    return `Your **overall attendance is ${data.overallAttendance}%** (${data.attendance.attended}/${data.attendance.totalClasses} classes).\\n\\nSubject-wise breakdown:\\n\\n${listAttendance(data)}${extra}`;
  }

  if (/(class|timetable|schedule|today|lecture|lab|period)/.test(q)) {
    const today = data.todayClasses;
    if (today.length === 0) return "No classes scheduled for today. Enjoy your day off!";
    const lines = today
      .slice()
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map(
        (c) =>
          `• **${formatTime12(c.startTime)} – ${formatTime12(c.endTime)}** — ${c.subject.name} (${c.type === "lab" ? "Lab" : "Lecture"}), Room ${c.room}`
      );
    return `Here's your schedule for **${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}**:\\n\\n${lines.join("\n")}`;
  }

  if (/(assignment|homework|submission|deadline|due)/.test(q)) {
    return `Here are your pending assignments:\\n\\n${listAssignments(data)}\\n\\nTip: submit assignments **at least a day early** to avoid last-minute issues.`;
  }

  if (/(notice|announcement|circular|office)/.test(q)) {
    return `Latest official notices:\\n\\n• **Examination form** — Summer 2026 semester forms due **28 August 2026** on the college portal. Fee **₹1,500**, late fine **₹500**. Students with attendance below 75% may be blocked.\\n\\n• **Semester fee reminder** — second instalment due **20 August 2026**; late payment attracts a penalty.\\n\\n• **Aurora 2026** — tech fest on 19–21 September; register before 5 September.\\n\\nVisit the Notices page for details and AI summaries.`;
  }

  if (/(study plan|revision|prepare|study schedule|planner)/.test(q)) {
    return `I can generate a personalised study plan for you. I'll consider:\\n\\n• Your **exam dates** (next: DBMS Mid-Term on 24 August)\\n• Your **weak subjects** (Digital Electronics at 70% attendance)\\n• Your preferred **study hours** and time of day\\n\\nHead to the **Study Planner** page, set your preferences and click **Generate AI Study Plan**. I'll build a day-by-day schedule with revision slots built in.`;
  }

  if (/(hello|help|what can you do|features?)/.test(q)) {
    return `I'm CampusPilot AI — your campus-wide intelligent assistant. Here's what I can do:\\n\\n• **Exams** — schedules, syllabus, countdowns and reminders\\n• **Attendance** — live status, warnings and recovery plans\\n• **Timetable** — today's classes and weekly view\\n• **Assignments** — deadlines, filters and submission tracking\\n• **Notices** — official announcements with AI summaries\\n• **Study planner** — AI-generated revision plans\\n\\nTry asking: *"When is my next exam?"* or *"Am I at risk of being debarred?"*`;
  }

  return `I'm not entirely sure about that, but here's what might help:\\n\\n• Your **next exam** is ${data.upcomingExams[0]?.title ?? "—"} on **${formatDate(data.upcomingExams[0]?.date ?? "")}** (${daysUntil(data.upcomingExams[0]?.date ?? "")} days away)\\n• You have **${data.upcomingAssignments.length} pending assignment(s)**\\n• Your overall attendance is **${data.overallAttendance}%**\\n\\nYou can also try asking about exams, attendance, today's classes, assignments, notices or study plans.`;
}

export function conversationTitle(query: string): string {
  const words = query
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 5);
  const title = words.join(" ");
  return title ? title.charAt(0).toUpperCase() + title.slice(1) : "New conversation";
}
