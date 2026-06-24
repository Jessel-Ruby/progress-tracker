from datetime import datetime
from typing import Optional, List, Annotated
from beanie import Document, Indexed
from pydantic import Field
from models.user import get_utc_now

class Task(Document):
    title: Annotated[str, Indexed()]
    description: str
    priority: str = "medium"  # low, medium, high
    deadline: Optional[datetime] = None
    status: str = "pending"  # pending, in_progress, completed, in_review
    assigned_to: Optional[str] = None  # stores User's string ID
    assigned_by: Optional[str] = None  # stores User's string ID (admin)
    department_id: Optional[str] = None  # stores Department's string ID
    voice_note_path: Optional[str] = None
    attachments: List[str] = []
    created_at: datetime = Field(default_factory=get_utc_now)

    class Settings:
        name = "tasks"

class TaskSubmission(Document):
    task_id: Annotated[str, Indexed()]  # stores Task's string ID
    user_id: Annotated[str, Indexed()]  # stores User's string ID
    file_path: Optional[str] = None
    comment: Optional[str] = None
    status: str = "pending"  # pending, approved, rejected
    feedback: Optional[str] = None
    reviewed_by: Optional[str] = None
    submitted_at: datetime = Field(default_factory=get_utc_now)

    class Settings:
        name = "task_submissions"
