from fastapi import FastAPI, HTTPException, Depends, status, Header, Request, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, validator
import os
from datetime import datetime
from typing import Optional, Dict, Any, List
import uuid
import json
import jwt
import aiohttp
from fastapi.security import OAuth2PasswordBearer
import logging
import aiofiles
import shutil
from fastapi.staticfiles import StaticFiles

# Import the storage module - using a try/except to handle both direct and module import
try:
    # When run through main.py
    from app.storage import store_image, delete_image, StorageError, ImageOptimizationError
except ImportError:
    # When run directly
    from backend.user_service.app.storage import store_image, delete_image, StorageError, ImageOptimizationError
except ImportError:
    # Fallback for direct run
    try:
        from app.storage import store_image, delete_image, StorageError, ImageOptimizationError
    except ImportError:
        # Create mock implementations if we can't import
        logging.warning("Unable to import storage module, using mock implementations")
        class StorageError(Exception): pass
        class ImageOptimizationError(Exception): pass
        async def store_image(file, user_id): return f"http://localhost:8001/uploads/{user_id}_image.jpg"
        async def delete_image(image_url): return True

# Environment variables
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:8000")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost,http://localhost:3000,https://candidatev.vercel.app").split(",")
USE_LOCAL_STORAGE = os.getenv("USE_LOCAL_STORAGE", "true").lower() == "true"
UPLOAD_DIR = os.getenv("LOCAL_STORAGE_PATH", "./uploads")
BASE_URL = os.getenv("BASE_URL", "http://localhost:8001")
JWT_SECRET = os.getenv("JWT_SECRET", "development_secret_key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# Create FastAPI app
app = FastAPI(title="CandidateV User Service")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists
if USE_LOCAL_STORAGE:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    # Mount uploads directory for static file serving
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# Models
class SocialLinks(BaseModel):
    linkedin: Optional[str] = None
    github: Optional[str] = None
    twitter: Optional[str] = None
    
    @validator('linkedin', 'github', 'twitter')
    def validate_urls(cls, v):
        if v is not None and not v.startswith('https://'):
            raise ValueError('URL must start with https://')
        return v
    
class Preferences(BaseModel):
    theme: Optional[str] = "light"
    notifications: Optional[bool] = True
    
    @validator('theme')
    def validate_theme(cls, v):
        if v not in ["light", "dark", "system"]:
            raise ValueError('Theme must be light, dark, or system')
        return v
    
class UserProfileUpdate(BaseModel):
    bio: Optional[str] = None
    job_title: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    social_links: Optional[SocialLinks] = None
    
    @validator('website')
    def validate_website(cls, v):
        if v is not None and not v.startswith('http'):
            raise ValueError('Website URL must start with http:// or https://')
        return v
    
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

class ExperienceCreate(BaseModel):
    company: str
    position: str
    start_date: str  # YYYY-MM format
    end_date: Optional[str] = None  # YYYY-MM format or null for current
    description: Optional[str] = None
    
class Experience(ExperienceCreate):
    id: str
    created_at: datetime
    updated_at: datetime

class EducationCreate(BaseModel):
    institution: str
    degree: str
    field_of_study: str
    start_date: str  # YYYY-MM format
    end_date: Optional[str] = None  # YYYY-MM format or null for current
    description: Optional[str] = None
    
class Education(EducationCreate):
    id: str
    created_at: datetime
    updated_at: datetime

# Mock database
MOCK_USERS = {}
MOCK_EXPERIENCES = {}
MOCK_EDUCATION = {}

# Helper function to simulate authentication
async def verify_token(token: Optional[str] = Depends(oauth2_scheme)):
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Verify token locally instead of calling auth service
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Get user ID from payload
        user_id = payload.get("user_id")
        email = payload.get("sub")
        
        if user_id is None or email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token format",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if user exists in our mock database
        if user_id not in MOCK_USERS:
            # Create a user if it doesn't exist
            MOCK_USERS[user_id] = {
                "id": user_id,
                "email": email,
                "name": "New User",
                "bio": None,
                "profile_image_url": None,
                "job_title": None,
                "location": None,
                "website": None,
                "social_links": {},
                "preferences": {"theme": "light", "notifications": True},
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        
        return MOCK_USERS[user_id]
    
    except (jwt.PyJWTError, Exception) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

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
        "database_connection": "ok",
        "auth_service_connection": "ok"
    }

@app.get("/api/users/me", response_model=UserProfile)
async def get_current_user_profile(current_user: dict = Depends(verify_token)):
    """Get the current user's profile."""
    return current_user

@app.put("/api/users/me", response_model=UserProfile)
async def update_user_profile(
    profile_update: UserProfileUpdate,
    current_user: dict = Depends(verify_token)
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
    
    # Update the user in our mock database
    MOCK_USERS[current_user["id"]] = current_user
    
    return current_user

@app.put("/api/users/me/preferences")
async def update_user_preferences(
    preferences_update: PreferencesUpdate,
    current_user: dict = Depends(verify_token)
):
    """Update the current user's preferences."""
    current_user["preferences"] = preferences_update.preferences.dict(exclude_none=True)
    current_user["updated_at"] = datetime.utcnow()
    
    # Update the user in our mock database
    MOCK_USERS[current_user["id"]] = current_user
    
    return {"preferences": current_user["preferences"]}

@app.post("/api/users/me/image", response_model=ProfileImageResponse)
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(verify_token)
):
    """Upload a profile image."""
    try:
        # Use our new storage module to store the image
        image_url = await store_image(file.file, current_user['id'])
        
        # Update user's profile image URL
        current_user["profile_image_url"] = image_url
        current_user["updated_at"] = datetime.utcnow()
        
        # Update the user in our mock database
        MOCK_USERS[current_user["id"]] = current_user
        
        return {"profile_image_url": image_url}
    except (StorageError, ImageOptimizationError) as e:
        # Handle storage errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error uploading image: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload image"
        )

# Experience endpoints
@app.get("/api/users/me/experience", response_model=List[Experience])
async def get_experiences(current_user: dict = Depends(verify_token)):
    """Get the current user's experiences."""
    user_id = current_user["id"]
    
    # Get experiences for this user
    user_experiences = MOCK_EXPERIENCES.get(user_id, [])
    return user_experiences

@app.post("/api/users/me/experience", response_model=Experience, status_code=status.HTTP_201_CREATED)
async def add_experience(
    experience: ExperienceCreate,
    current_user: dict = Depends(verify_token)
):
    """Add a new experience."""
    user_id = current_user["id"]
    
    # Create a new experience
    exp_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    new_experience = {
        **experience.dict(),
        "id": exp_id,
        "created_at": now,
        "updated_at": now
    }
    
    # Add to mock database
    if user_id not in MOCK_EXPERIENCES:
        MOCK_EXPERIENCES[user_id] = []
    
    MOCK_EXPERIENCES[user_id].append(new_experience)
    
    return new_experience

@app.put("/api/users/me/experience/{experience_id}", response_model=Experience)
async def update_experience(
    experience_id: str,
    experience_update: ExperienceCreate,
    current_user: dict = Depends(verify_token)
):
    """Update an experience."""
    user_id = current_user["id"]
    
    # Check if user has experiences
    if user_id not in MOCK_EXPERIENCES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No experiences found"
        )
    
    # Find the experience to update
    for i, exp in enumerate(MOCK_EXPERIENCES[user_id]):
        if exp["id"] == experience_id:
            # Update the experience
            updated_exp = {
                **experience_update.dict(),
                "id": experience_id,
                "created_at": exp["created_at"],
                "updated_at": datetime.utcnow()
            }
            
            MOCK_EXPERIENCES[user_id][i] = updated_exp
            return updated_exp
    
    # If we get here, the experience wasn't found
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Experience not found"
    )

@app.delete("/api/users/me/experience/{experience_id}")
async def delete_experience(
    experience_id: str,
    current_user: dict = Depends(verify_token)
):
    """Delete an experience."""
    user_id = current_user["id"]
    
    # Check if user has experiences
    if user_id not in MOCK_EXPERIENCES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No experiences found"
        )
    
    # Find the experience to delete
    for i, exp in enumerate(MOCK_EXPERIENCES[user_id]):
        if exp["id"] == experience_id:
            # Delete the experience
            MOCK_EXPERIENCES[user_id].pop(i)
            return {"message": "Experience deleted"}
    
    # If we get here, the experience wasn't found
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Experience not found"
    )

# Education endpoints
@app.get("/api/users/me/education", response_model=List[Education])
async def get_education(current_user: dict = Depends(verify_token)):
    """Get the current user's education."""
    user_id = current_user["id"]
    
    # Get education for this user
    user_education = MOCK_EDUCATION.get(user_id, [])
    return user_education

@app.post("/api/users/me/education", response_model=Education, status_code=status.HTTP_201_CREATED)
async def add_education(
    education: EducationCreate,
    current_user: dict = Depends(verify_token)
):
    """Add a new education."""
    user_id = current_user["id"]
    
    # Create a new education
    edu_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    new_education = {
        **education.dict(),
        "id": edu_id,
        "created_at": now,
        "updated_at": now
    }
    
    # Add to mock database
    if user_id not in MOCK_EDUCATION:
        MOCK_EDUCATION[user_id] = []
    
    MOCK_EDUCATION[user_id].append(new_education)
    
    return new_education

@app.put("/api/users/me/education/{education_id}", response_model=Education)
async def update_education(
    education_id: str,
    education_update: EducationCreate,
    current_user: dict = Depends(verify_token)
):
    """Update an education."""
    user_id = current_user["id"]
    
    # Check if user has education
    if user_id not in MOCK_EDUCATION:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No education found"
        )
    
    # Find the education to update
    for i, edu in enumerate(MOCK_EDUCATION[user_id]):
        if edu["id"] == education_id:
            # Update the education
            updated_edu = {
                **education_update.dict(),
                "id": education_id,
                "created_at": edu["created_at"],
                "updated_at": datetime.utcnow()
            }
            
            MOCK_EDUCATION[user_id][i] = updated_edu
            return updated_edu
    
    # If we get here, the education wasn't found
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Education not found"
    )

@app.delete("/api/users/me/education/{education_id}")
async def delete_education(
    education_id: str,
    current_user: dict = Depends(verify_token)
):
    """Delete an education."""
    user_id = current_user["id"]
    
    # Check if user has education
    if user_id not in MOCK_EDUCATION:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No education found"
        )
    
    # Find the education to delete
    for i, edu in enumerate(MOCK_EDUCATION[user_id]):
        if edu["id"] == education_id:
            # Delete the education
            MOCK_EDUCATION[user_id].pop(i)
            return {"message": "Education deleted"}
    
    # If we get here, the education wasn't found
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Education not found"
    )

# For testing and development
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8001"))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True) 