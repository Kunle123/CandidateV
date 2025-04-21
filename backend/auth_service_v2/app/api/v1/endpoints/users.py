"""User endpoints for registration and profile management."""
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.status import HTTP_400_BAD_REQUEST, HTTP_404_NOT_FOUND

from app.api.deps.db import get_db
from app.api.deps.auth import get_current_active_user
from app.models.user import User, UserCreate, UserUpdate
from app.services.user import (
    create_user,
    get_user_by_email,
    update_user,
    verify_user_email,
    create_email_verification_token
)
from app.services.auth import send_verification_email
from app.core.config import get_settings

router = APIRouter()

@router.post("/register", response_model=User, status_code=201)
async def register(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: UserCreate,
    background_tasks: BackgroundTasks
) -> Any:
    """
    Create new user with email verification.
    """
    # Check if user exists
    user = await get_user_by_email(db, email=user_in.email)
    if user:
        if not user.is_active and not user.is_email_verified:
            # If user exists but isn't verified, create new verification token
            token = await create_email_verification_token(db, user)
            # Send new verification email
            await send_verification_email(db, user.email, token.token, user.name)
            return user
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )

    # Create new user
    user = await create_user(db, user_in)
    
    # Create verification token
    token = await create_email_verification_token(db, user)
    
    # Send verification email immediately instead of background task
    # This ensures the email is sent before we return
    try:
        await send_verification_email(db, user.email, token.token, user.name)
    except Exception as e:
        # Log the error but don't fail the registration
        print(f"Failed to send verification email: {str(e)}")
        # Return user without verification token
        return user
    
    return user

@router.post("/verify-email")
async def verify_email(
    token: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Verify user's email using verification token.
    """
    try:
        if not await verify_user_email(db, token):
            raise HTTPException(
                status_code=HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification token"
            )
        return {"message": "Email verified successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail=f"Email verification failed: {str(e)}"
        )

@router.get("/me", response_model=User)
async def read_user_me(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.put("/me", response_model=User)
async def update_user_me(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Update current user.
    """
    if user_in.email and user_in.email != current_user.email:
        if await get_user_by_email(db, email=user_in.email):
            raise HTTPException(
                status_code=HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    user = await update_user(db, current_user, user_in)
    return user 