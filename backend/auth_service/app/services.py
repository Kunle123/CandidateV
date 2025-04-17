from sqlalchemy.orm import Session
import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext
import secrets
import string
import jwt
import os
from typing import Optional, Dict, Any, List

from .models import User, RefreshToken, ResetToken

# Environment variables
SECRET_KEY = os.getenv("JWT_SECRET", "development_secret_key")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
RESET_TOKEN_EXPIRE_MINUTES = int(os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "15"))

# Password handling
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    """Hash a password for storing."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a stored password against a provided password."""
    return pwd_context.verify(plain_password, hashed_password)


def create_user(db: Session, email: str, password: str, name: str) -> User:
    """Create a new user in the database."""
    db_user = User(
        id=uuid.uuid4(),
        email=email,
        hashed_password=get_password_hash(password),
        name=name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get a user by email."""
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: uuid.UUID) -> Optional[User]:
    """Get a user by ID."""
    return db.query(User).filter(User.id == user_id).first()


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a new JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(db: Session, user_id: uuid.UUID) -> RefreshToken:
    """Create a new refresh token in the database."""
    # Generate a secure random token
    token_value = secrets.token_urlsafe(64)
    
    # Set expiration (7 days)
    expires_at = datetime.utcnow() + timedelta(days=7)
    
    # Create refresh token record
    db_token = RefreshToken(
        id=uuid.uuid4(),
        user_id=user_id,
        token=token_value,
        expires_at=expires_at
    )
    
    # Save to database
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    
    return db_token


def verify_refresh_token(db: Session, token: str) -> Optional[RefreshToken]:
    """Verify a refresh token and return it if valid."""
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token == token,
        RefreshToken.expires_at > datetime.utcnow(),
        RefreshToken.revoked == False
    ).first()
    
    return db_token


def revoke_refresh_token(db: Session, token: str) -> bool:
    """Revoke a refresh token."""
    db_token = db.query(RefreshToken).filter(RefreshToken.token == token).first()
    if db_token:
        db_token.revoked = True
        db.commit()
        return True
    return False


def revoke_all_user_tokens(db: Session, user_id: uuid.UUID) -> int:
    """Revoke all refresh tokens for a user."""
    tokens = db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.revoked == False
    ).all()
    
    count = 0
    for token in tokens:
        token.revoked = True
        count += 1
    
    db.commit()
    return count


def create_password_reset_token(db: Session, user_id: uuid.UUID) -> ResetToken:
    """Create a password reset token."""
    # Generate a secure random token
    alphabet = string.ascii_letters + string.digits
    token_value = ''.join(secrets.choice(alphabet) for _ in range(40))
    
    # Set expiration
    expires_at = datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    
    # Create reset token record
    db_token = ResetToken(
        id=uuid.uuid4(),
        user_id=user_id,
        token=token_value,
        expires_at=expires_at
    )
    
    # Save to database
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    
    return db_token


def verify_reset_token(db: Session, token: str) -> Optional[ResetToken]:
    """Verify a password reset token and return it if valid."""
    db_token = db.query(ResetToken).filter(
        ResetToken.token == token,
        ResetToken.expires_at > datetime.utcnow(),
        ResetToken.used == False
    ).first()
    
    return db_token


def mark_reset_token_used(db: Session, token_id: uuid.UUID) -> bool:
    """Mark a reset token as used."""
    db_token = db.query(ResetToken).filter(ResetToken.id == token_id).first()
    if db_token:
        db_token.used = True
        db.commit()
        return True
    return False


def reset_password(db: Session, user_id: uuid.UUID, new_password: str) -> bool:
    """Reset a user's password."""
    db_user = get_user_by_id(db, user_id)
    if db_user:
        db_user.hashed_password = get_password_hash(new_password)
        db.commit()
        return True
    return False


def clean_expired_tokens(db: Session) -> Dict[str, int]:
    """Delete expired and used tokens from the database."""
    now = datetime.utcnow()
    
    # Delete expired refresh tokens
    expired_refresh = db.query(RefreshToken).filter(
        RefreshToken.expires_at < now
    ).delete()
    
    # Delete expired or used reset tokens
    expired_reset = db.query(ResetToken).filter(
        (ResetToken.expires_at < now) | (ResetToken.used == True)
    ).delete()
    
    db.commit()
    
    return {
        "refresh_tokens": expired_refresh,
        "reset_tokens": expired_reset
    } 