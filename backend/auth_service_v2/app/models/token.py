"""Token models for authentication."""
from typing import Optional
from pydantic import BaseModel

class Token(BaseModel):
    """Token model for authentication responses."""
    access_token: str
    token_type: str
    refresh_token: Optional[str] = None

class TokenPayload(BaseModel):
    """Token payload model for JWT claims."""
    sub: str  # subject (user id)
    exp: Optional[int] = None  # expiration time
    type: Optional[str] = "access"  # token type (access or refresh)
