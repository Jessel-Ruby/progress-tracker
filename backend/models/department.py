from datetime import datetime
from typing import Optional, List, Annotated
from beanie import Document, Indexed
from pydantic import Field
from models.user import get_utc_now

class Department(Document):
    name: Annotated[str, Indexed(unique=True)]
    description: Optional[str] = None
    owner_id: Optional[str] = None  # User ID of the HOD who leads this department
    member_ids: List[str] = []      # User IDs of members in this department
    created_at: datetime = Field(default_factory=get_utc_now)

    class Settings:
        name = "departments"
