from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime

import re

# --- USER ---
class UserBase(BaseModel):
    username: str
    email: EmailStr

    @field_validator('email')
    @classmethod
    def validate_email_domain(cls, v: str) -> str:
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, v):
            raise ValueError('Invalid email format. Email must end with a valid domain suffix (e.g. .com, .org, .in)')
        return v

class UserCreate(UserBase):
    password: str

    @field_validator('password')
    @classmethod
    def validate_password_length(cls, v: str) -> str:
        if len(v) < 8 or len(v) > 12:
            raise ValueError('Password must be between 8 and 12 characters long')
        return v


class UserResponse(UserBase):
    id: str
    role: str
    xp: int
    level: int
    rank: str
    streak: int
    contribution_score: int
    profile_image: Optional[str]
    created_at: datetime

    @field_validator('id', mode='before')
    @classmethod
    def convert_id(cls, v):
        return str(v)

    class Config:
        from_attributes = True

# --- AUTH ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

# --- TASK SUBMISSION ---
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
    submitted_at: datetime
    
    class Config:
        from_attributes = True

class AdminTaskSubmissionResponse(TaskSubmissionResponse):
    task_title: str
    submitter_username: str

class SubmissionReviewUpdate(BaseModel):
    feedback: Optional[str] = None

# --- TASK ---
class TaskBase(BaseModel):
    title: str
    description: str
    priority: str = "medium"
    deadline: Optional[datetime] = None
    assigned_to: Optional[str] = None

class TaskCreate(TaskBase):
    pass

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
    voice_note_path: Optional[str]
    created_at: datetime
    submissions: List[TaskSubmissionResponse] = []

    class Config:
        from_attributes = True
