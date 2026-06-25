from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    department_id: Optional[str] = None  # department they want to sign up for
    requested_role: Optional[str] = "member"  # member / hod / president / vp

class UserResponse(UserBase):
    id: str
    role: str
    department_id: Optional[str]
    is_president: bool
    is_vice_president: bool
    status: str
    xp: int
    level: int
    streak: int
    profile_image: Optional[str]
    created_at: datetime

    @field_validator('id', mode='before')
    @classmethod
    def convert_id(cls, v):
        return str(v)

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
