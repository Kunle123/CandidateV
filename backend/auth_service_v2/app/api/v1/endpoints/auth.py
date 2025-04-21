"""Authentication endpoints for login, token refresh, and password management."""
from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from starlette.status import HTTP_400_BAD_REQUEST

from app.api.deps.db import get_db
from app.core.config import settings
from app.core.security import create_access_token
from app.models.token import Token
from app.models.user import User
from app.services.auth import (
    authenticate_user,
    get_refresh_token,
    create_refresh_token,
    revoke_refresh_token,
    send_password_reset_email,
    reset_password,
    verify_password_reset_token
)

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    if not user.email_verified:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Email not verified"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        user.id, expires_delta=access_token_expires
    )
    
    refresh_token = await create_refresh_token(db, user.id)
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        refresh_token=refresh_token.token
    )

@router.post("/refresh", response_model=Token)
async def refresh_token(
    db: Session = Depends(get_db),
    refresh_token: str = None
) -> Token:
    """
    Refresh access token.
    """
    if not refresh_token:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Refresh token is required"
        )
    
    token = await get_refresh_token(db, refresh_token)
    if not token or token.is_expired() or token.revoked:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Invalid or expired refresh token"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        token.user_id, expires_delta=access_token_expires
    )
    
    # Create a new refresh token and revoke the old one
    new_refresh_token = await create_refresh_token(db, token.user_id)
    await revoke_refresh_token(db, token.token)
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        refresh_token=new_refresh_token.token
    )

@router.post("/password-reset/request")
async def request_password_reset(
    email: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
) -> dict:
    """
    Request a password reset token.
    """
    background_tasks.add_task(send_password_reset_email, db, email)
    return {"message": "If the email exists, a password reset link will be sent"}

@router.post("/password-reset/verify")
async def verify_reset_token(
    token: str,
    db: Session = Depends(get_db)
) -> dict:
    """
    Verify that a password reset token is valid.
    """
    is_valid = await verify_password_reset_token(db, token)
    if not is_valid:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    return {"message": "Token is valid"}

@router.post("/password-reset/reset")
async def reset_user_password(
    token: str,
    new_password: str,
    db: Session = Depends(get_db)
) -> dict:
    """
    Reset password using a reset token.
    """
    success = await reset_password(db, token, new_password)
    if not success:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    return {"message": "Password has been reset successfully"} 