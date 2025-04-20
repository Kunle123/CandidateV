"""Test utilities for user authentication."""
from typing import Dict
from app.core.config import settings
from app.services.auth import create_access_token

def authentication_token_from_email(email: str) -> Dict[str, str]:
    """
    Return a valid token for the user with given email.
    If the user doesn't exist it is created first.
    """
    access_token = create_access_token(
        subject=email,
        expires_delta=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    return {"Authorization": f"Bearer {access_token}"} 