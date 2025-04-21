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
    verify_user_email
)
from app.services.auth import send_verification_email

router = APIRouter()

@router.post("/register", response_model=User)
async def register(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: UserCreate,
    background_tasks: BackgroundTasks
) -> Any:
    """
    Create new user with email verification.
    """
    user = await get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )
    user = await create_user(db, user_in)
    background_tasks.add_task(send_verification_email, db, user.email)
    return user

@router.post("/verify-email")
async def verify_email(
    token: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Verify user's email using verification token.
    """
    if not await verify_user_email(db, token):
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    return {"message": "Email verified successfully"}

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