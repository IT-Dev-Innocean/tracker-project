from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class AIGenerateModel(BaseModel):
    prompt: str
    provider: Optional[str] = "auto"


class RequestFormModel(BaseModel):
    project_name: str
    requester: str
    category: str
    description: str
    supporting_access: str
    start_date: str
    deadline: str
    impact: Optional[str] = "Medium"
    etc: Optional[float] = 2.0
    auto_nudge: Optional[bool] = False
    recurring: Optional[str] = "none"
    subtasks: Optional[List[dict]] = []


class TaskUpdateModel(BaseModel):
    status: str


class TaskEditModel(BaseModel):
    project_name: str
    requester: str
    category: str
    description: str
    supporting_access: str
    start_date: str
    deadline: str
    impact: Optional[str] = "Medium"
    etc: Optional[float] = 2.0
    auto_nudge: Optional[bool] = False
    recurring: Optional[str] = "none"
    status: str
    board_id: Optional[int] = None


class SubtaskModel(BaseModel):
    task_name: str
    assignee: Optional[str] = None


class SubtaskToggleModel(BaseModel):
    is_done: int
    assignee: Optional[str] = None


class CommentModel(BaseModel):
    text: str


class AIChatModel(BaseModel):
    text: str


class RegisterModel(BaseModel):
    full_name: str
    email: str
    username: str
    password: str


class LoginModel(BaseModel):
    username: str
    password: str


class GoogleLoginModel(BaseModel):
    token: str


class VerifyModel(BaseModel):
    token: str


class BoardModel(BaseModel):
    name: str
    is_private: Optional[int] = 0


class BoardSettingsModel(BaseModel):
    statuses: str
    categories: str


class InviteModel(BaseModel):
    members_input: str


class AdminActionModel(BaseModel):
    username: str
    status: Optional[str] = None
    offboard_date: Optional[str] = None


class SubtaskReorderModel(BaseModel):
    ordered_ids: List[int]


class FeedbackModel(BaseModel):
    text: str


class ProfileUpdateModel(BaseModel):
    full_name: str
    email: str
    avatar: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None


class SystemConfigModel(BaseModel):
    smtp_server: Optional[str] = None
    smtp_port: Optional[str] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    gemini_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    database_url: Optional[str] = None
    google_calendar_api_key: Optional[str] = None
    secret_key: Optional[str] = None


class SudoVerifyModel(BaseModel):
    password: str


class AutoNudgeToggleModel(BaseModel):
    auto_nudge: bool


class LeaveModel(BaseModel):
    start_date: str
    end_date: Optional[str] = None
    description: str
    leave_type: str


class TransferToMemberModel(BaseModel):
    new_owner: str


class TransferBoardModel(BaseModel):
    new_owner: str


class DMModel(BaseModel):
    text: str


class TimesheetEntryModel(BaseModel):
    request_id: Optional[int] = None
    board_id: Optional[int] = None
    date: str
    hours_logged: float
    description: Optional[str] = None
    custom_project_name: Optional[str] = None
    custom_task_name: Optional[str] = None


class TimesheetUpdateModel(BaseModel):
    hours_logged: Optional[float] = None
    description: Optional[str] = None
    status: Optional[str] = None


class TimesheetSubmitModel(BaseModel):
    entry_ids: List[int]


class TimesheetApproveModel(BaseModel):
    entry_ids: List[int]
    status: str # "Approved" or "Rejected"


class TimesheetApproverUpdateModel(BaseModel):
    approver_username: Optional[str] = None

