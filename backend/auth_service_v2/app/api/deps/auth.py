"""Authorization dependencies for role-based access control."""
from typing import Annotated, Optional
from fastapi import Depends, HTTPException, Security
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session
from starlette.status import HTTP_403_FORBIDDEN, HTTP_401_UNAUTHORIZED

from app.core.config import settings
from app.core.security import ALGORITHM
from app.db.session import get_db
from app.models.token import TokenPayload
from app.models.user import User
from app.services.user import get_user_by_id

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

async def get_current_user(
    db: Annotated[Session, Depends(get_db)],
    token: Annotated[str, Depends(oauth2_scheme)]
) -> User:
    """
    Get the current user based on the JWT token.
    Validates token and ensures user exists and is active.
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (jwt.JWTError, ValidationError):
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = get_user_by_id(db, token_data.sub)
    if not user:
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="Inactive user"
        )
    return user

async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    """Ensure the current user is active."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="Inactive user"
        )
    return current_user

async def get_current_active_superuser(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    """Ensure the current user is an active superuser."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="Inactive user"
        )
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
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
        current_user: Annotated[User, Depends(get_current_user)]
    ) -> User:
        if not current_user.is_active:
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED,
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
            status_code=HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )

# Common role checkers
require_active = RoleChecker([])  # Just checks if user is active
require_admin = RoleChecker(["admin"])  # Requires admin role
require_moderator = RoleChecker(["moderator", "admin"])  # Requires moderator or admin role 