from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, field_validator

class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None

class DepartmentResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    owner_id: Optional[str] = None
    member_ids: List[str] = []
    created_at: datetime

    @field_validator('id', mode='before')
    @classmethod
    def convert_id(cls, v):
        return str(v)

    class Config:
        from_attributes = True

class DepartmentMemberAdd(BaseModel):
    user_id: str

class MemberTaskProgress(BaseModel):
    title: str
    status: str

class MemberProgress(BaseModel):
    username: str
    task_counts_by_status: dict[str, int]
    tasks: List[MemberTaskProgress]

class DepartmentProgressResponse(BaseModel):
    total_tasks: int
    completed_tasks: int
    progress_percent: float
    per_member: List[MemberProgress]

