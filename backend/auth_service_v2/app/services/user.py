"""User service module."""
from typing import Optional, List, Dict, Any
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.expression import and_
from fastapi import HTTPException
from starlette.status import HTTP_400_BAD_REQUEST
from datetime import datetime, timedelta
import secrets

from app.db.models import User, EmailVerificationToken
from app.core.password import get_password_hash, verify_password
from app.models.user import UserCreate, UserUpdate
from app.core.config import settings

async def get_user(db: AsyncSession, user_id: int) -> Optional[User]:
    """Get a user by ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()

async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Get a user by email."""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()

async def get_users(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    filters: Dict[str, Any] = None
) -> List[User]:
    """Get a list of users."""
    query = select(User)
    
    if filters:
        conditions = []
        if filters.get("email"):
            conditions.append(User.email.ilike(f"%{filters['email']}%"))
        if filters.get("name"):
            conditions.append(User.name.ilike(f"%{filters['name']}%"))
        if filters.get("is_active") is not None:
            conditions.append(User.is_active == filters["is_active"])
        if filters.get("is_superuser") is not None:
            conditions.append(User.is_superuser == filters["is_superuser"])
        if conditions:
            query = query.where(and_(*conditions))
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
    """Create a new user."""
    db_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        name=user_in.name,
        is_active=False,  # Users start as inactive until email verification
        email_verified=False,
        is_superuser=user_in.is_superuser,
        roles=user_in.roles
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def update_user(
    db: AsyncSession,
    db_user: User,
    user_in: UserUpdate
) -> User:
    """Update a user."""
    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def delete_user(db: AsyncSession, user_id: int) -> bool:
    """Delete a user."""
    result = await db.execute(
        delete(User).where(User.id == user_id)
    )
    await db.commit()
    return bool(result.rowcount)

async def authenticate_user(
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

async def add_user_role(
    db: AsyncSession,
    user: User,
    role: str
) -> User:
    """Add a role to user if they don't already have it."""
    if role not in user.roles:
        user.roles = user.roles + [role]
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user

async def remove_user_role(
    db: AsyncSession,
    user: User,
    role: str
) -> User:
    """Remove a role from user if they have it."""
    if role in user.roles:
        user.roles = [r for r in user.roles if r != role]
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user

def has_role(user: User, role: str) -> bool:
    """Check if user has specific role."""
    return user.is_superuser or role in user.roles 

async def verify_user_email(db: AsyncSession, token: str) -> bool:
    """Verify user's email using verification token."""
    result = await db.execute(
        select(EmailVerificationToken)
        .filter(EmailVerificationToken.token == token)
        .filter(EmailVerificationToken.expires_at > datetime.utcnow())
    )
    verification = result.scalar_one_or_none()
    
    if not verification:
        return False
        
    user = await get_user_by_email(db, email=verification.email)
    if not user:
        return False
        
    user.email_verified = True
    user.is_active = True  # Activate user when email is verified
    db.add(user)
    await db.delete(verification)
    await db.commit()
    return True 

async def create_email_verification_token(db: AsyncSession, user: User) -> EmailVerificationToken:
    """Create a new email verification token."""
    # Delete any existing tokens for this user
    await db.execute(
        delete(EmailVerificationToken).where(EmailVerificationToken.email == user.email)
    )
    await db.commit()
    
    # Create new token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS)
    
    verification_token = EmailVerificationToken(
        email=user.email,
        token=token,
        expires_at=expires_at
    )
    
    db.add(verification_token)
    await db.commit()
    await db.refresh(verification_token)
    
    return verification_token 