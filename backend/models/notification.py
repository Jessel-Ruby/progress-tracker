from datetime import datetime
from typing import Annotated
from beanie import Document, Indexed
from pydantic import Field
from models.user import get_utc_now

class Notification(Document):
    user_id: Annotated[str, Indexed()]  # stores User's string ID
    title: str
    message: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=get_utc_now)

    class Settings:
        name = "notifications"
