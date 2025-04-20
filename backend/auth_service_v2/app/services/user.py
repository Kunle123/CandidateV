"""User service module."""
from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException
from starlette.status import HTTP_400_BAD_REQUEST

from app.db.models import User
from app.models.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password

def get_user(db: Session, user_id: int) -> Optional[User]:
    """Get user by ID."""
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email."""
    return db.query(User).filter(User.email == email).first()

def get_users(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    role: Optional[str] = None
) -> List[User]:
    """
    Get list of users.
    Optionally filter by role if provided.
    """
    query = db.query(User)
    if role:
        query = query.filter(User.roles.any(role))
    return query.offset(skip).limit(limit).all()

def create_user(db: Session, user_in: UserCreate) -> User:
    """Create new user."""
    user = get_user_by_email(db, email=user_in.email)
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
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(
    db: Session,
    user: User,
    user_in: UserUpdate
) -> User:
    """Update user."""
    if user_in.email is not None:
        existing_user = get_user_by_email(db, email=user_in.email)
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
    db.commit()
    db.refresh(user)
    return user

def authenticate_user(
    db: Session,
    email: str,
    password: str
) -> Optional[User]:
    """Authenticate user by email and password."""
    user = get_user_by_email(db, email=email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def add_user_role(
    db: Session,
    user: User,
    role: str
) -> User:
    """Add a role to user if they don't already have it."""
    if role not in user.roles:
        user.roles = user.roles + [role]
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

def remove_user_role(
    db: Session,
    user: User,
    role: str
) -> User:
    """Remove a role from user if they have it."""
    if role in user.roles:
        user.roles = [r for r in user.roles if r != role]
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

def has_role(user: User, role: str) -> bool:
    """Check if user has specific role."""
    return user.is_superuser or role in user.roles 