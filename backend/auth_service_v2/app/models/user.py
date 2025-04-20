"""User models for authentication."""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, constr

class UserBase(BaseModel):
    """Base user model."""
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    is_active: Optional[bool] = True
    is_superuser: Optional[bool] = False
    roles: List[str] = []

class UserCreate(UserBase):
    """User creation model."""
    email: EmailStr
    name: str
    password: constr(min_length=8)

class UserUpdate(UserBase):
    """User update model."""
    password: Optional[constr(min_length=8)] = None

class UserInDBBase(UserBase):
    """Base user in DB schema."""
    id: Optional[int] = None
    hashed_password: str
    roles: List[str] = []

    class Config:
        """Pydantic configuration."""
        from_attributes = True

class User(UserBase):
    """User model with all fields."""
    id: str
    email_verified: bool = False
    failed_login_attempts: int = 0
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic configuration."""
        from_attributes = True

class UserInDB(UserInDBBase):
    """User in DB schema (internal use)."""
    pass 