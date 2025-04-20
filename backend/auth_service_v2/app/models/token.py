"""Token models for authentication."""
from typing import Optional
from pydantic import BaseModel

class Token(BaseModel):
    """Token model for authentication responses."""
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None

class TokenData(BaseModel):
    """Token data schema."""
    sub: Optional[str] = None
    exp: Optional[int] = None
    type: Optional[str] = None

class TokenPayload(BaseModel):
    """Token payload model for JWT claims."""
    sub: Optional[str] = None
    exp: Optional[int] = None
    type: Optional[str] = "access"  # token type (access or refresh)

class RefreshToken(BaseModel):
    """Refresh token schema."""
    refresh_token: str
