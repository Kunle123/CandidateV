"""Authentication service module."""
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, Any
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from starlette.status import HTTP_400_BAD_REQUEST

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    create_password_reset_token,
    create_email_verification_token,
    verify_token
)
from app.core.password import get_password_hash, verify_password
from app.db.models import User, RefreshToken, PasswordResetToken, EmailVerificationToken
from app.services.user import get_user_by_email, get_user
from app.core.email import send_email
from app.models.token import Token
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.schemas.token import TokenPayload
from app.core.password import generate_password_reset_token, verify_password_reset_token
from app.core.email import send_reset_password_email, send_new_account_email

async def authenticate(
    db: AsyncSession,
    email: str,
    password: str
) -> Optional[User]:
    """Authenticate a user."""
    user = await get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

async def login(
    db: AsyncSession,
    email: str,
    password: str
) -> Optional[Token]:
    """Login a user."""
    user = await authenticate(db, email, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    return Token(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id)
    )

async def refresh_token(
    db: AsyncSession,
    refresh_token: str
) -> Optional[Token]:
    """Refresh an access token."""
    user_id = verify_token(refresh_token, "refresh")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await get_user(db, int(user_id))
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return Token(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id)
    )

async def request_password_reset(
    db: AsyncSession,
    email: str
) -> bool:
    """Request a password reset."""
    user = await get_user_by_email(db, email)
    if not user:
        # Don't reveal that the user doesn't exist
        return False
    
    token = create_password_reset_token(email)
    # TODO: Send password reset email
    return True

async def reset_password(
    db: AsyncSession,
    token: str,
    new_password: str
) -> bool:
    """Reset a user's password."""
    email = verify_token(token, "password_reset")
    if not email:
        return False
    
    user = await get_user_by_email(db, email)
    if not user:
        return False
    
    user.hashed_password = get_password_hash(new_password)
    db.add(user)
    await db.commit()
    return True

async def verify_email(
    db: AsyncSession,
    token: str
) -> bool:
    """Verify a user's email."""
    email = verify_token(token, "email_verification")
    if not email:
        return False
    
    user = await get_user_by_email(db, email)
    if not user:
        return False
    
    user.is_active = True
    user.email_verified = True
    user.email_verified_at = datetime.utcnow()
    db.add(user)
    await db.commit()
    return True

async def create_refresh_token(db: AsyncSession, user_id: str) -> RefreshToken:
    """Create a new refresh token for user."""
    token = RefreshToken(
        token=str(uuid4()),
        user_id=user_id,
        expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(token)
    await db.commit()
    await db.refresh(token)
    return token

async def get_refresh_token(db: AsyncSession, token: str) -> Optional[RefreshToken]:
    """Get refresh token by token string."""
    result = await db.execute(
        select(RefreshToken).filter(RefreshToken.token == token)
    )
    return result.scalar_one_or_none()

async def revoke_refresh_token(db: AsyncSession, token: str) -> bool:
    """Revoke a refresh token."""
    db_token = await get_refresh_token(db, token)
    if not db_token:
        return False
    db_token.revoked = True
    db.add(db_token)
    await db.commit()
    return True

async def create_password_reset_token(db: AsyncSession, user: User) -> PasswordResetToken:
    """Create a password reset token."""
    token = PasswordResetToken(
        token=str(uuid4()),
        user_id=user.id,
        expires_at=datetime.utcnow() + timedelta(hours=settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS)
    )
    db.add(token)
    await db.commit()
    await db.refresh(token)
    return token

async def get_password_reset_token(db: AsyncSession, token: str) -> Optional[PasswordResetToken]:
    """Get password reset token by token string."""
    result = await db.execute(
        select(PasswordResetToken).filter(PasswordResetToken.token == token)
    )
    return result.scalar_one_or_none()

async def verify_password_reset_token(db: AsyncSession, token: str) -> bool:
    """Verify that a password reset token is valid."""
    db_token = await get_password_reset_token(db, token)
    if not db_token:
        return False
    if db_token.used or db_token.expires_at < datetime.utcnow():
        return False
    return True

async def reset_password_with_token(db: AsyncSession, token: str, new_password: str) -> bool:
    """Reset user's password using a reset token."""
    db_token = await get_password_reset_token(db, token)
    if not db_token or db_token.used or db_token.expires_at < datetime.utcnow():
        return False
    
    user = await get_user(db, db_token.user_id)
    if not user:
        return False
        
    user.hashed_password = get_password_hash(new_password)
    db_token.used = True
    
    db.add(user)
    db.add(db_token)
    await db.commit()
    return True

async def create_email_verification_token(db: AsyncSession, user: User) -> EmailVerificationToken:
    """Create an email verification token."""
    token = EmailVerificationToken(
        token=str(uuid4()),
        user_id=user.id,
        expires_at=datetime.utcnow() + timedelta(hours=settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS)
    )
    db.add(token)
    await db.commit()
    await db.refresh(token)
    return token

async def verify_email_token(db: AsyncSession, token: str) -> bool:
    """Verify an email verification token."""
    result = await db.execute(
        select(EmailVerificationToken)
        .filter(EmailVerificationToken.token == token)
        .filter(EmailVerificationToken.expires_at > datetime.utcnow())
    )
    db_token = result.scalar_one_or_none()
    
    if not db_token or db_token.used:
        return False
    
    user = await get_user(db, db_token.user_id)
    if not user:
        return False
        
    user.email_verified = True
    db_token.used = True
    
    db.add(user)
    db.add(db_token)
    await db.commit()
    return True

async def send_password_reset_email(db: AsyncSession, email: str) -> None:
    """Send password reset email to user."""
    user = await get_user_by_email(db, email)
    if not user:
        return
    
    token = await create_password_reset_token(db, user)
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token.token}"
    
    await send_email(
        email_to=user.email,
        subject="Password Reset Request",
        template_name="password_reset",
        template_data={
            "user_name": user.name or user.email,
            "reset_link": reset_link,
            "expires_in": settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS
        }
    )

async def send_verification_email(db: AsyncSession, email: str) -> None:
    """Send email verification link to user."""
    user = await get_user_by_email(db, email)
    if not user:
        return
    
    token = await create_email_verification_token(db, user)
    verification_link = f"{settings.FRONTEND_URL}/verify-email?token={token.token}"
    
    await send_email(
        email_to=user.email,
        subject="Verify Your Email",
        template_name="email_verification",
        template_data={
            "user_name": user.name or user.email,
            "verification_link": verification_link,
            "expires_in": settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS
        }
    ) 