from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
import logging
import json
import typing as t

from .database import get_db_session
from .auth import get_current_user
from .models import UserProfile
from .schemas import UserProfile as UserProfileSchema
from .schemas import UserProfileUpdate, ProfileImageResponse, UserPreferencesUpdate, UserPreferencesResponse
from .storage import store_image, delete_image

router = APIRouter(prefix="/api/users")
logger = logging.getLogger(__name__)

@router.get("/me", response_model=UserProfileSchema)
async def get_current_user_profile(current_user: UserProfile = Depends(get_current_user)):
    """Get the current user's profile."""
    # We need to fetch external info (email, name) from the authentication service
    # In a real implementation, you would make an API call to the auth service
    # For this implementation, we'll mock the data
    
    # Convert the model to a dictionary and add mock data
    user_data = {
        "id": str(current_user.id),
        "bio": current_user.bio,
        "profile_image_url": current_user.profile_image_url,
        "job_title": current_user.job_title,
        "location": current_user.location,
        "website": current_user.website,
        "social_links": current_user.social_links or {},
        "preferences": current_user.preferences or {"theme": "light", "notifications": True},
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at,
        # Mock data that would come from auth service
        "name": "John Doe",
        "email": "john.doe@example.com"
    }
    
    return user_data

@router.put("/me", response_model=UserProfileSchema)
async def update_user_profile(
    profile_update: UserProfileUpdate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Update the current user's profile."""
    # Update user profile fields
    if profile_update.bio is not None:
        current_user.bio = profile_update.bio
    if profile_update.job_title is not None:
        current_user.job_title = profile_update.job_title
    if profile_update.location is not None:
        current_user.location = profile_update.location
    if profile_update.website is not None:
        current_user.website = profile_update.website
    if profile_update.social_links is not None:
        current_user.social_links = profile_update.social_links.dict()
    if profile_update.preferences is not None:
        current_user.preferences = profile_update.preferences.dict()
    
    # Save changes to database
    db.commit()
    db.refresh(current_user)
    
    # Return updated profile with external data
    return {
        "id": str(current_user.id),
        "bio": current_user.bio,
        "profile_image_url": current_user.profile_image_url,
        "job_title": current_user.job_title,
        "location": current_user.location,
        "website": current_user.website,
        "social_links": current_user.social_links,
        "preferences": current_user.preferences,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at,
        # Mock data that would come from auth service
        "name": "John Doe",
        "email": "john.doe@example.com"
    }

@router.post("/me/image", response_model=ProfileImageResponse)
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Upload a profile image for the current user."""
    # Upload the image and get the URL
    image_url = await store_image(file.file, str(current_user.id))
    
    # Update the user profile with the new image URL
    current_user.profile_image_url = image_url
    db.commit()
    
    return {"profile_image_url": image_url}

@router.delete("/me/image", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile_image(
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Delete the current user's profile image."""
    # Check if user has a profile image
    if not current_user.profile_image_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No profile image to delete"
        )
    
    # Delete the image file
    deleted = await delete_image(current_user.profile_image_url)
    if not deleted:
        logger.warning(f"Failed to delete image file: {current_user.profile_image_url}")
    
    # Update the user profile
    current_user.profile_image_url = None
    db.commit()
    
    # Return no content
    return None

@router.put("/me/preferences", response_model=UserPreferencesResponse)
async def update_user_preferences(
    preferences_update: UserPreferencesUpdate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Update the current user's preferences."""
    # Update preferences
    current_user.preferences = preferences_update.preferences.dict()
    
    # Save changes to database
    db.commit()
    
    return {"preferences": preferences_update.preferences} 