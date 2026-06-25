from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class ActivityLogEntry(BaseModel):
    """A single activity-log row enriched with user and department info."""
    id: str
    activity_type: str
    points_earned: int
    created_at: datetime
    username: str
    department_name: Optional[str] = None

    class Config:
        from_attributes = True


class ActivityLogResponse(BaseModel):
    entries: List[ActivityLogEntry]
    total: int
