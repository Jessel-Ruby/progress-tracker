from datetime import datetime, date, timezone
from typing import Optional, List, Annotated
from beanie import Document, Indexed
from pydantic import Field

def get_utc_now():
    return datetime.now(timezone.utc)

class User(Document):
    username: Annotated[str, Indexed(unique=True)]
    email: Annotated[str, Indexed(unique=True)]
    password_hash: str
    role: str = "member"  # member / hod
    department_id: Optional[str] = None  # ID of the department the user belongs to
    is_president: bool = False
    is_vice_president: bool = False
    status: str = "pending"  # pending / active
    xp: int = 0
    level: int = 1
    streak: int = 0
    profile_image: Optional[str] = None
    last_login_date: Optional[date] = None
    created_at: datetime = Field(default_factory=get_utc_now)

    class Settings:
        name = "users"
