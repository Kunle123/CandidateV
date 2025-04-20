"""User service module."""
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from starlette.status import HTTP_400_BAD_REQUEST

from app.db.models import User
from app.models.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password

async def get_user(db: AsyncSession, user_id: int) -> Optional[User]:
    """Get user by ID."""
    result = await db.execute(select(User).filter(User.id == user_id))
    return result.scalar_one_or_none()

async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Get user by email."""
    result = await db.execute(select(User).filter(User.email == email))
    return result.scalar_one_or_none()

async def get_users(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    role: Optional[str] = None
) -> List[User]:
    """
    Get list of users.
    Optionally filter by role if provided.
    """
    query = select(User)
    if role:
        query = query.filter(User.roles.any(role))
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()

async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
    """Create new user."""
    user = await get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    db_user = User(
        email=user_in.email,
        name=user_in.name,
        hashed_password=get_password_hash(user_in.password),
        is_superuser=user_in.is_superuser,
        roles=user_in.roles
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def update_user(
    db: AsyncSession,
    user: User,
    user_in: UserUpdate
) -> User:
    """Update user."""
    if user_in.email is not None:
        existing_user = await get_user_by_email(db, email=user_in.email)
        if existing_user and existing_user.id != user.id:
            raise HTTPException(
                status_code=HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        user.email = user_in.email
    
    if user_in.password is not None:
        user.hashed_password = get_password_hash(user_in.password)
    
    if user_in.name is not None:
        user.name = user_in.name
    
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    
    if user_in.roles is not None:
        user.roles = user_in.roles
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def authenticate_user(
    db: AsyncSession,
    email: str,
    password: str
) -> Optional[User]:
    """Authenticate user by email and password."""
    user = await get_user_by_email(db, email=email)
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