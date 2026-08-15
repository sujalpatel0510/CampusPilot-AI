export interface Student {
  id: string
  name: string
  email: string
  college: string
  course: string
  semester: number
  avatar?: string
}

export interface StudentProfile extends Student {
  rollNo: string
  department: string
  batch: string
  phone?: string
}

export interface Subject {
  id: string
  name: string
  code: string
  faculty: string
  room: string
  color: string
}

export type AttendanceStatus = 'good' | 'warning' | 'critical'

export interface AttendanceRecord {
  subjectId: string
  totalClasses: number
  attended: number
  percentage: number
  status: AttendanceStatus
  trend: number[]
}

export interface AttendanceOverview {
  overall: number
  totalClasses: number
  attended: number
  subjects: AttendanceRecord[]
  trend: { week: string; percentage: number }[]
}

export type ClassStatus = 'completed' | 'ongoing' | 'upcoming'

export interface TimetableEntry {
  id: string
  subjectId: string
  day: number
  startTime: string
  endTime: string
  room: string
  type: 'lecture' | 'lab'
  frequency: 'weekly' | 'alternate'
}

export type AssignmentStatus = 'pending' | 'completed' | 'overdue'

export interface Assignment {
  id: string
  subjectId: string
  title: string
  description: string
  dueDate: string
  submitted: boolean
  status: AssignmentStatus
  weightage: number
}

export interface Exam {
  id: string
  subjectId: string
  title: string
  date: string
  startTime: string
  endTime: string
  room: string
  type: 'quiz' | 'mid-term' | 'end-term' | 'internal'
  completed: boolean
  marks: number
  syllabus: string[]
}

export type NoticeCategory = 'Examination' | 'Academic' | 'Event' | 'Fee' | 'Placement' | 'General'

export interface Notice {
  id: string
  title: string
  content: string
  summary: string
  aiSummary: string
  category: NoticeCategory
  date: string
  isImportant: boolean
  hasAttachment: boolean
  postedBy: string
}

export type MaterialCategory =
  | 'Notes'
  | 'PDFs'
  | 'Previous Year Papers'
  | 'Presentations'
  | 'Assignments'

export type MaterialFileType = 'PDF' | 'PPTX' | 'DOCX' | 'XLSX' | 'ZIP'

export interface StudyMaterial {
  id: string
  name: string
  subjectId: string
  category: MaterialCategory
  fileType: MaterialFileType
  size: string
  uploadedBy: string
  uploadDate: string
  downloads: number
}

export type NotificationType = 'assignment' | 'attendance' | 'exam' | 'notice' | 'general'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  date: string
  read: boolean
  link?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export type PreferredTime = 'morning' | 'evening' | 'night'

export interface StudyPlanForm {
  examDates: Record<string, string>
  availableHours: number
  weakSubjects: string[]
  preferredTime: PreferredTime
}

export type StudyPlanSlotType = 'study' | 'revision'

export interface StudyPlanSlot {
  id: string
  day: number
  date: string
  startTime: string
  endTime: string
  subjectId: string
  topic: string
  type: StudyPlanSlotType
}

export interface StudyPlan {
  id: string
  name: string
  createdAt: string
  form: StudyPlanForm
  slots: StudyPlanSlot[]
}

export interface DashboardData {
  overallAttendance: number
  assignmentsDue: number
  examsUpcoming: number
  todayClasses: (TimetableEntry & { subject: Subject; status: ClassStatus })[]
  attendance: AttendanceOverview
  upcomingAssignments: (Assignment & { subject: Subject })[]
  upcomingExams: (Exam & { subject: Subject })[]
}

export interface UploadedFileRecord {
  id: string
  name: string
  size: string
  uploadDate: string
  status: 'processing' | 'done'
}
