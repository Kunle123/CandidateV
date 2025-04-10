from fastapi import FastAPI, HTTPException, Depends, status, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import os
from datetime import datetime
from typing import Optional, Dict, Any
import uuid

# Create FastAPI app
app = FastAPI(title="CandidateV User Service")

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class SocialLinks(BaseModel):
    linkedin: Optional[str] = None
    github: Optional[str] = None
    twitter: Optional[str] = None
    
class Preferences(BaseModel):
    theme: Optional[str] = "light"
    notifications: Optional[bool] = True
    
class UserProfileUpdate(BaseModel):
    bio: Optional[str] = None
    job_title: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    social_links: Optional[SocialLinks] = None
    
class UserProfile(BaseModel):
    id: str
    email: EmailStr
    name: str
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None
    job_title: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    social_links: Optional[Dict[str, str]] = None
    preferences: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    
class PreferencesUpdate(BaseModel):
    preferences: Preferences
    
class ProfileImageResponse(BaseModel):
    profile_image_url: str

# Mock data
MOCK_USER = {
    "id": "test-user-id",
    "email": "test@example.com",
    "name": "Test User",
    "bio": "This is a test user",
    "profile_image_url": None,
    "job_title": "Software Developer",
    "location": "Test City",
    "website": None,
    "social_links": {"linkedin": "https://linkedin.com/in/testuser"},
    "preferences": {"theme": "light", "notifications": True},
    "created_at": datetime.utcnow(),
    "updated_at": datetime.utcnow()
}

# Helper function to simulate authentication
async def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # In a real app, we would validate the token
    # For this demo, we just return the mock user
    return MOCK_USER

# Routes
@app.get("/")
async def root():
    return {"message": "CandidateV User Service"}

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "database_connection": "ok"
    }

@app.get("/api/users/me", response_model=UserProfile)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Get the current user's profile."""
    return current_user

@app.put("/api/users/me", response_model=UserProfile)
async def update_user_profile(
    profile_update: UserProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update the current user's profile."""
    # In a real app, we would update the database
    # For this demo, we just update the mock user
    if profile_update.bio is not None:
        current_user["bio"] = profile_update.bio
    if profile_update.job_title is not None:
        current_user["job_title"] = profile_update.job_title
    if profile_update.location is not None:
        current_user["location"] = profile_update.location
    if profile_update.website is not None:
        current_user["website"] = profile_update.website
    if profile_update.social_links is not None:
        current_user["social_links"] = profile_update.social_links.dict(exclude_none=True)
    
    current_user["updated_at"] = datetime.utcnow()
    
    return current_user

@app.put("/api/users/me/preferences")
async def update_user_preferences(
    preferences_update: PreferencesUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update the current user's preferences."""
    current_user["preferences"] = preferences_update.preferences.dict(exclude_none=True)
    current_user["updated_at"] = datetime.utcnow()
    
    return {"preferences": current_user["preferences"]}

@app.post("/api/users/me/image", response_model=ProfileImageResponse)
async def upload_profile_image(current_user: dict = Depends(get_current_user)):
    """Simulate uploading a profile image."""
    image_url = f"https://example.com/images/{uuid.uuid4()}.jpg"
    current_user["profile_image_url"] = image_url
    
    return {"profile_image_url": image_url}

# For testing Railway deployment
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8001"))
    uvicorn.run("app:app", host="0.0.0.0", port=port) 