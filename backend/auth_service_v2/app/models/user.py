"""User model and related schemas."""
from typing import Optional, List
from pydantic import BaseModel, EmailStr, constr

class UserBase(BaseModel):
    """Shared properties."""
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = True
    is_superuser: bool = False
    name: Optional[str] = None
    roles: List[str] = []

class UserCreate(UserBase):
    """Properties to receive via API on creation."""
    email: EmailStr
    password: constr(min_length=8)
    name: str

class UserUpdate(UserBase):
    """Properties to receive via API on update."""
    password: Optional[constr(min_length=8)] = None

class UserInDBBase(UserBase):
    """Base DB user schema."""
    id: Optional[int] = None

    class Config:
        from_attributes = True

class User(UserInDBBase):
    """Additional properties to return via API."""
    pass

class UserInDB(UserInDBBase):
    """Additional properties stored in DB."""
    hashed_password: str 