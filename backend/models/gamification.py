from datetime import datetime
from typing import Annotated
from beanie import Document, Indexed
from pydantic import Field
from models.user import get_utc_now

class ActivityLog(Document):
    user_id: Annotated[str, Indexed()]  # stores User's string ID
    activity_type: str  # task_completed, submission_approved, daily_login
    points_earned: int = 0
    created_at: datetime = Field(default_factory=get_utc_now)

    class Settings:
        name = "activity_logs"
