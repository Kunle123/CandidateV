"""Security utilities."""
from datetime import datetime, timedelta
from typing import Any, Union, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models import User
from app.api.deps.db import get_db
from app.services.user import get_user

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate password hash."""
    return pwd_context.hash(password)

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """Get current user from token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await get_user(db, user_id)
    if user is None:
        raise credentials_exception
    return user

def create_token(subject: Union[str, Any], expires_delta: timedelta = None, token_type: str = "access") -> str:
    """Create a JWT token."""
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