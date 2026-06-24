from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class TaskSubmissionBase(BaseModel):
    task_id: str
    comment: Optional[str] = None

class TaskSubmissionCreate(TaskSubmissionBase):
    pass

class TaskSubmissionResponse(TaskSubmissionBase):
    id: str
    user_id: str
    file_path: Optional[str]
    status: str
    feedback: Optional[str]
    reviewed_by: Optional[str] = None
    submitted_at: datetime
    
    class Config:
        from_attributes = True

class AdminTaskSubmissionResponse(TaskSubmissionResponse):
    task_title: str
    submitter_username: str

class SubmissionReviewUpdate(BaseModel):
    feedback: Optional[str] = None

class TaskBase(BaseModel):
    title: str
    description: str
    priority: str = "medium"
    deadline: Optional[datetime] = None
    assigned_to: Optional[str] = None

class TaskCreate(TaskBase):
    department_id: Optional[str] = None  # If provided, overrides creator's own department (President/VP only)

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    voice_note_path: Optional[str] = None

class TaskResponse(TaskBase):
    id: str
    status: str
    assigned_by: str
    department_id: Optional[str] = None
    voice_note_path: Optional[str]
    attachments: List[str] = []
    created_at: datetime
    submissions: List[TaskSubmissionResponse] = []

    class Config:
        from_attributes = True
