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
  subjectName?: string
  subjectCode?: string
  color?: string
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
  subjectName?: string
  subjectCode?: string
  facultyName?: string
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
  priority?: string
  subjectName?: string
  subjectCode?: string
  subjectColor?: string
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
  subjectName?: string
  subjectCode?: string
  daysLeft?: number
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
  subjectName?: string
  subjectCode?: string
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
  subjectName?: string
  subjectCode?: string
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

// ---------------------------------------------------------------------------
// Backend session & roles
// ---------------------------------------------------------------------------

export type Role = 'student' | 'faculty' | 'admin'

export interface AuthUser {
  id: number
  email: string
  full_name: string
  role: Role
  student_id?: string | null
  employee_id?: string | null
  department?: string | null
  college?: string | null
  course?: string | null
  semester?: number | null
}

export interface Session {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export interface FacultyProfile {
  id: number
  user_id: number
  employee_id: string
  department: string
  full_name: string
  email: string
  role: Role
  is_active: boolean
}

export interface FacultySubject {
  id: number
  name: string
  code: string
  department: string
  semester: number
  credits: number
}

export interface SubjectStudent {
  id: number
  student_id: string
  full_name: string
  email: string
  total_classes: number
  attended_classes: number
  percentage: number
  status: string
  attendance_id?: number | null
}

export interface FacultyAssignment {
  id: number
  subject_id: number
  faculty_id: number
  title: string
  description: string
  due_date: string
  priority: string
  created_at: string
  subject_code: string
  subject_name: string
  status?: string | null
}

export interface FacultyTimetableEntry {
  id: number
  subject_id: number
  faculty_id: number
  department: string
  semester: number
  section: string
  day_of_week: string
  start_time: string
  end_time: string
  room: string
  subject_code: string
  subject_name: string
  faculty_name: string
}

export interface FacultyExam {
  id: number
  subject_id: number
  department: string
  semester: number
  section: string
  exam_type: string
  exam_date: string
  start_time: string
  end_time: string
  room: string
  subject_code: string
  subject_name: string
  days_left?: number | null
  is_today?: boolean
}

export interface FacultyNotice {
  id: number
  title: string
  original_file_url: string
  extracted_text: string
  ai_summary: string
  category: string
  is_important: boolean
  created_at: string
}

export interface FacultyMaterial {
  id: number
  subject_id: number
  title: string
  description: string
  file_url: string
  file_type: string
  file_size: number
  created_at: string
  subject_code: string
  subject_name: string
}

export interface AttendanceRecordRow {
  id: number
  student_id: number
  subject_id: number
  subject_code: string
  subject_name: string
  total_classes: number
  attended_classes: number
  missed_classes: number
  percentage: number
  status: string
}
