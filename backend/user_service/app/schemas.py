from pydantic import BaseModel, EmailStr, Field, UUID4, HttpUrl
from typing import Optional, Dict, Any
from datetime import datetime

class SocialLinks(BaseModel):
    linkedin: Optional[str] = None
    github: Optional[str] = None
    twitter: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    website: Optional[str] = None

class Preferences(BaseModel):
    theme: Optional[str] = "light"
    notifications: Optional[bool] = True
    email_notifications: Optional[bool] = True

class UserProfileBase(BaseModel):
    bio: Optional[str] = None
    job_title: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    social_links: Optional[SocialLinks] = None

class UserProfileCreate(UserProfileBase):
    pass

class UserProfileUpdate(UserProfileBase):
    name: Optional[str] = None
    preferences: Optional[Preferences] = None

class UserProfile(UserProfileBase):
    id: UUID4
    profile_image_url: Optional[str] = None
    name: str
    email: EmailStr
    preferences: Optional[Preferences] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ProfileImageResponse(BaseModel):
    profile_image_url: str

class UserPreferencesUpdate(BaseModel):
    preferences: Preferences

class UserPreferencesResponse(BaseModel):
    preferences: Preferences

class HealthCheck(BaseModel):
    status: str
    timestamp: datetime
    version: str
    database_connection: str
    database_details: Optional[Dict[str, Any]] = None
    auth_service_connection: str
    auth_service_details: Optional[Dict[str, Any]] = None 