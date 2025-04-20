"""Authentication dependency module."""
from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import ALGORITHM
from app.db.models import User
from app.api.deps.db import get_db
from app.services.user import get_user

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

async def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """Get current user from token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = get_user(db, user_id)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current active user."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

async def get_current_active_superuser(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Get current active superuser."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

def check_self_or_superuser(
    current_user: User,
    user_id: int
) -> bool:
    """Check if the current user is accessing their own data or is a superuser."""
    return current_user.is_superuser or current_user.id == user_id

class RoleChecker:
    """Dependency class to check user roles."""
    
    def __init__(self, required_roles: list[str]):
        self.required_roles = required_roles
    
    async def __call__(
        self,
        current_user: User = Depends(get_current_user)
    ) -> User:
        if not current_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Inactive user"
            )
        
        # Superusers have access to everything
        if current_user.is_superuser:
            return current_user
            
        # Check if user has any of the required roles
        user_roles = current_user.roles if hasattr(current_user, "roles") else []
        for role in self.required_roles:
            if role in user_roles:
                return current_user
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )

# Common role checkers
require_active = RoleChecker([])  # Just checks if user is active
require_admin = RoleChecker(["admin"])  # Requires admin role
require_moderator = RoleChecker(["moderator", "admin"])  # Requires moderator or admin role 