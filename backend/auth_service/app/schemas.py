from pydantic import BaseModel, EmailStr, Field, UUID4
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: UUID4
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: UUID4
    created_at: datetime
    
    class Config:
        from_attributes = True

class TokenData(BaseModel):
    user_id: str
    exp: datetime

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int

class RefreshToken(BaseModel):
    refresh_token: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int

class MessageResponse(BaseModel):
    message: str

class HealthCheck(BaseModel):
    status: str
    timestamp: datetime
    version: str
    database_connection: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

class ResetTokenDB(BaseModel):
    id: UUID4
    user_id: UUID4
    token: str
    expires_at: datetime
    created_at: datetime
    used: bool
    
    class Config:
        from_attributes = True 