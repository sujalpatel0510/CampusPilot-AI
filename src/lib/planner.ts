import type { PreferredTime, StudyPlan, StudyPlanForm, StudyPlanSlot } from "@/types";
import { addDays, addMinutes, DAY_LABELS, uid } from "@/lib/utils";

const SUBJECT_NAMES = new Map<string, string>([
  ["sub-dsa", "DSA"],
  ["sub-dbms", "DBMS"],
  ["sub-os", "OS"],
  ["sub-de", "Digital Electronics"],
  ["sub-cn", "CN"],
  ["sub-math", "Probability & Stats"],
]);

const PREFERRED_START: Record<PreferredTime, string> = {
  morning: "09:00",
  evening: "17:00",
  night: "20:00",
};

const TOPICS: Record<string, string[]> = {
  "sub-dsa": ["Trees — BST, traversal, AVL rotations", "Heaps & priority queues", "Graph algorithms — BFS, DFS", "Hashing & collision resolution", "Dynamic programming basics"],
  "sub-dbms": ["ER Modelling & relational algebra", "SQL queries — joins, subqueries", "Normalisation up to 3NF", "Transactions & concurrency", "Indexing & query optimisation"],
  "sub-os": ["Process synchronisation", "Deadlocks — detection & avoidance", "Memory management & paging", "CPU scheduling algorithms", "File systems"],
  "sub-de": ["Boolean algebra & K-maps", "Combinational circuits", "Sequential circuits — flip-flops", "Counters & registers", "Logic gate minimisation"],
  "sub-cn": ["Layered architecture (OSI/TCP-IP)", "Physical layer basics", "Data link layer & error control", "Network layer & IP addressing", "Transport layer & TCP/UDP"],
  "sub-math": ["Probability distributions", "Bayes' theorem practice", "Hypothesis testing", "Sampling & confidence intervals", "Regression & correlation"],
};

export function generateStudyPlan(form: StudyPlanForm): StudyPlan {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const entries = Object.entries(form.examDates)
    .filter(([, date]) => date)
    .map(([subjectId, date]) => ({ subjectId, date: new Date(date + "T00:00:00") }))
    .filter((e) => e.date.getTime() >= today.getTime())
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (entries.length === 0) {
    return {
      id: uid("plan"),
      name: "Study plan",
      createdAt: new Date().toISOString(),
      form,
      slots: [],
    };
  }

  const horizon = entries[entries.length - 1].date;
  const maxDays = Math.min(10, Math.max(3, Math.ceil((horizon.getTime() - today.getTime()) / 86400000) - 1));
  const slots: StudyPlanSlot[] = [];
  const topicIndex: Record<string, number> = {};

  for (let d = 1; d <= maxDays; d++) {
    const date = addDays(today, d);
    const dayNumber = (date.getDay() + 6) % 7;
    const pending = entries.filter((e) => e.date.getTime() >= date.getTime());
    if (pending.length === 0) break;

    const studiedToday: string[] = [];
    let cursor = PREFERRED_START[form.preferredTime];

    for (let b = 0; b < form.availableHours; b++) {
      const candidate = pending
        .filter((e) => !studiedToday.includes(e.subjectId))
        .sort((a, b2) => {
          const aWeak = form.weakSubjects.includes(a.subjectId) ? 2 : 0;
          const bWeak = form.weakSubjects.includes(b2.subjectId) ? 2 : 0;
          return a.date.getTime() - b2.date.getTime() - (aWeak - bWeak) * 86400000;
        });

      let slot: StudyPlanSlot;

      if (b === form.availableHours - 1 && studiedToday.length > 0) {
        const subjectId = studiedToday[0];
        slot = {
          id: uid("slot"),
          day: dayNumber,
          date: date.toISOString(),
          startTime: cursor,
          endTime: addMinutes(cursor, 45),
          subjectId,
          topic: "Revision of today's topics",
          type: "revision",
        };
      } else {
        const chosen = candidate.length > 0 ? candidate[0] : pending[0];
        if (!chosen) break;
        const pool = TOPICS[chosen.subjectId] ?? ["Chapter revision"];
        topicIndex[chosen.subjectId] = topicIndex[chosen.subjectId] ?? 0;
        const topic = pool[topicIndex[chosen.subjectId] % pool.length];
        topicIndex[chosen.subjectId] += 1;
        studiedToday.push(chosen.subjectId);
        slot = {
          id: uid("slot"),
          day: dayNumber,
          date: date.toISOString(),
          startTime: cursor,
          endTime: addMinutes(cursor, 60),
          subjectId: chosen.subjectId,
          topic,
          type: "study",
        };
      }

      slots.push(slot);
      cursor = addMinutes(slot.endTime, 15);
      if (dayNumber === 5) cursor = addMinutes(cursor, 60);
    }
  }

  const label = entries.map((e) => SUBJECT_NAMES.get(e.subjectId) ?? "Subject").join(" · ");
  return {
    id: uid("plan"),
    name: `Exam prep — ${label.slice(0, 48)}`,
    createdAt: new Date().toISOString(),
    form,
    slots,
  };
}

export function seedStudyPlan(): StudyPlan {
  return generateStudyPlan({
    examDates: {
      "sub-dbms": "2026-08-24",
      "sub-dsa": "2026-08-19",
      "sub-os": "2026-08-28",
    },
    availableHours: 3,
    weakSubjects: ["sub-de"],
    preferredTime: "evening",
  });
}

export function planSummary(plan: StudyPlan): string {
  if (plan.slots.length === 0) return "No sessions planned.";
  const subjects = new Set(plan.slots.map((s) => s.subjectId));
  const totalMinutes = plan.slots.reduce((sum, s) => {
    const [sh, sm] = s.startTime.split(":").map(Number);
    const [eh, em] = s.endTime.split(":").map(Number);
    return sum + (eh * 60 + em - (sh * 60 + sm));
  }, 0);
  return `${plan.slots.length} sessions across ${subjects.size} subjects · ${Math.round(totalMinutes / 60)} hours of study · ${DAY_LABELS[plan.slots[0].day]} to ${DAY_LABELS[plan.slots[plan.slots.length - 1].day]}.`;
}
