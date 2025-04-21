"""Security utilities."""
from datetime import datetime, timedelta
from typing import Any, Dict, Optional
from jose import jwt
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

async def create_token(
    subject: str,
    token_type: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create JWT token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {
        "exp": expire,
        "sub": subject,
        "type": token_type
    }
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

async def verify_token(token: str, token_type: str) -> str:
    """Verify JWT token and return subject."""
    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM]
    )
    if payload.get("type") != token_type:
        raise ValueError("Invalid token type")
    return payload.get("sub")

async def create_access_token(subject: str) -> str:
    """Create access token."""
    return await create_token(
        subject=subject,
        token_type="access",
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

async def create_refresh_token(subject: str) -> str:
    """Create refresh token."""
    return await create_token(
        subject=subject,
        token_type="refresh",
        expires_delta=timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    )

async def create_password_reset_token(subject: str) -> str:
    """Create password reset token."""
    return await create_token(
        subject=subject,
        token_type="reset",
        expires_delta=timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)
    )

async def create_email_verification_token(subject: str) -> str:
    """Create email verification token."""
    return await create_token(
        subject=subject,
        token_type="verify_email",
        expires_delta=timedelta(minutes=settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_MINUTES)
    ) 