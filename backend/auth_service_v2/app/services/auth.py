"""Authentication service module."""
from datetime import datetime, timedelta
from typing import Optional
from uuid import uuid4
from sqlalchemy.orm import Session
from fastapi import HTTPException
from starlette.status import HTTP_400_BAD_REQUEST

from app.core.config import settings
from app.core.password import get_password_hash, verify_password
from app.db.models import User, RefreshToken, PasswordResetToken, EmailVerificationToken
from app.services.user import get_user_by_email
from app.core.email import send_email

async def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticate user by email and password."""
    user = await get_user_by_email(db, email=email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def create_refresh_token(db: Session, user_id: str) -> RefreshToken:
    """Create a new refresh token for user."""
    token = RefreshToken(
        token=str(uuid4()),
        user_id=user_id,
        expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(token)
    db.commit()
    db.refresh(token)
    return token

def get_refresh_token(db: Session, token: str) -> Optional[RefreshToken]:
    """Get refresh token by token string."""
    return db.query(RefreshToken).filter(RefreshToken.token == token).first()

def revoke_refresh_token(db: Session, token: str) -> bool:
    """Revoke a refresh token."""
    db_token = get_refresh_token(db, token)
    if not db_token:
        return False
    db_token.revoked = True
    db.add(db_token)
    db.commit()
    return True

def create_password_reset_token(db: Session, user: User) -> PasswordResetToken:
    """Create a password reset token."""
    token = PasswordResetToken(
        token=str(uuid4()),
        user_id=user.id,
        expires_at=datetime.utcnow() + timedelta(hours=settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS)
    )
    db.add(token)
    db.commit()
    db.refresh(token)
    return token

def get_password_reset_token(db: Session, token: str) -> Optional[PasswordResetToken]:
    """Get password reset token by token string."""
    return db.query(PasswordResetToken).filter(PasswordResetToken.token == token).first()

def verify_password_reset_token(db: Session, token: str) -> bool:
    """Verify that a password reset token is valid."""
    db_token = get_password_reset_token(db, token)
    if not db_token:
        return False
    if db_token.used or db_token.expires_at < datetime.utcnow():
        return False
    return True

def reset_password(db: Session, token: str, new_password: str) -> bool:
    """Reset user's password using a reset token."""
    db_token = get_password_reset_token(db, token)
    if not db_token or db_token.used or db_token.expires_at < datetime.utcnow():
        return False
    
    user = db_token.user
    user.hashed_password = get_password_hash(new_password)
    db_token.used = True
    
    db.add(user)
    db.add(db_token)
    db.commit()
    return True

def create_email_verification_token(db: Session, user: User) -> EmailVerificationToken:
    """Create an email verification token."""
    token = EmailVerificationToken(
        token=str(uuid4()),
        user_id=user.id,
        expires_at=datetime.utcnow() + timedelta(hours=settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS)
    )
    db.add(token)
    db.commit()
    db.refresh(token)
    return token

def verify_email_token(db: Session, token: str) -> bool:
    """Verify an email verification token."""
    db_token = db.query(EmailVerificationToken).filter(EmailVerificationToken.token == token).first()
    if not db_token or db_token.used or db_token.expires_at < datetime.utcnow():
        return False
    
    user = db_token.user
    user.email_verified = True
    db_token.used = True
    
    db.add(user)
    db.add(db_token)
    db.commit()
    return True

async def send_password_reset_email(db: Session, email: str) -> None:
    """Send password reset email to user."""
    user = get_user_by_email(db, email)
    if not user:
        return
    
    token = create_password_reset_token(db, user)
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

async def send_verification_email(db: Session, email: str) -> None:
    """Send email verification link to user."""
    user = get_user_by_email(db, email)
    if not user:
        return
    
    token = create_email_verification_token(db, user)
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