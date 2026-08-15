from app.schemas.common import (
    ErrorDetail,
    ErrorResponse,
    MessageResponse,
    ORMModel,
    Paginated,
)
from app.schemas.auth import (
    AuthUserOut,
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.schemas.student import StudentCreate, StudentOut, StudentUpdate
from app.schemas.faculty import FacultyCreate, FacultyOut, FacultyUpdate
from app.schemas.subject import SubjectCreate, SubjectOut, SubjectUpdate, SubjectWithAttendance
from app.schemas.attendance import AttendanceCreate, AttendanceOut, AttendanceStatusOut, AttendanceUpdate
from app.schemas.timetable import TimetableCreate, TimetableDayOut, TimetableOut, TimetableUpdate
from app.schemas.assignment import AssignmentCreate, AssignmentOut, AssignmentUpdate
from app.schemas.exam import ExamCreate, ExamOut, ExamUpdate
from app.schemas.notice import NoticeCreate, NoticeOut, NoticeUpdate, NoticeUploadResult
from app.schemas.study_material import StudyMaterialCreate, StudyMaterialOut, StudyMaterialUpdate
from app.schemas.notification import NotificationCreate, NotificationOut
from app.schemas.study_plan import StudyPlanGenerateRequest, StudyPlanOut
from app.schemas.ai import ChatRequest, ChatResponse, ConversationOut, ConversationCreate, MessageOut
from app.schemas.bulk_upload import ImportCommitResult, ImportErrorRow, ImportValidationResult
