from typing import Optional, Annotated
from datetime import datetime, date
from beanie import Document
from beanie import Indexed
from pydantic import Field

def get_utc_now():
    return datetime.utcnow()

class User(Document):
    username: Annotated[str, Indexed(unique=True)]
    email: Annotated[str, Indexed(unique=True)]
    password_hash: str
    role: str = "user" # admin / user
    xp: int = 0
    level: int = 1
    rank: str = "Beginner"
    streak: int = 0
    contribution_score: int = 0
    profile_image: Optional[str] = None
    last_login_date: Optional[date] = None
    created_at: datetime = Field(default_factory=get_utc_now)

    class Settings:
        name = "users"

class Task(Document):
    title: Annotated[str, Indexed()]
    description: str
    priority: str = "medium" # low, medium, high
    deadline: Optional[datetime] = None
    status: str = "pending" # pending, in_progress, completed, in_review
    assigned_to: Optional[str] = None # stores User's string ID
    assigned_by: Optional[str] = None # stores User's string ID (admin)
    voice_note_path: Optional[str] = None
    created_at: datetime = Field(default_factory=get_utc_now)

    class Settings:
        name = "tasks"

class TaskSubmission(Document):
    task_id: Annotated[str, Indexed()] # stores Task's string ID
    user_id: Annotated[str, Indexed()] # stores User's string ID
    file_path: Optional[str] = None
    comment: Optional[str] = None
    status: str = "pending" # pending, approved, rejected
    feedback: Optional[str] = None
    submitted_at: datetime = Field(default_factory=get_utc_now)

    class Settings:
        name = "task_submissions"

class ActivityLog(Document):
    user_id: Annotated[str, Indexed()] # stores User's string ID
    activity_type: str # task_completed, submission_approved, daily_login
    points_earned: int = 0
    created_at: datetime = Field(default_factory=get_utc_now)

    class Settings:
        name = "activity_logs"

class Achievement(Document):
    title: Annotated[str, Indexed(unique=True)]
    description: str
    badge_icon: str
    xp_reward: int = 0

    class Settings:
        name = "achievements"

class UserAchievement(Document):
    user_id: Annotated[str, Indexed()] # stores User's string ID
    achievement_id: Annotated[str, Indexed()] # stores Achievement's string ID
    earned_at: datetime = Field(default_factory=get_utc_now)

    class Settings:
        name = "user_achievements"

class Notification(Document):
    user_id: Annotated[str, Indexed()] # stores User's string ID
    title: str
    message: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=get_utc_now)

    class Settings:
        name = "notifications"
