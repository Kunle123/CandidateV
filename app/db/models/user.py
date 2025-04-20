"""User model for authentication and user management."""
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, Column, String, DateTime
from sqlalchemy.orm import relationship

from .base import Base, UUIDMixin

class User(Base, UUIDMixin):
    """User model for authentication and profile data."""
    
    # Authentication fields
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    # Profile fields
    name = Column(String, nullable=True)
    
    # Email verification
    verification_token = Column(String, unique=True, nullable=True)
    verification_token_expires = Column(DateTime, nullable=True)
    
    # Password reset
    reset_token = Column(String, unique=True, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    
    # Last login tracking
    last_login = Column(DateTime, nullable=True)
    
    # Relationships
    refresh_tokens = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        """String representation of the user."""
        return f"<User {self.email}>"
    
    @property
    def is_password_reset_token_valid(self) -> bool:
        """Check if password reset token is valid."""
        if not self.reset_token or not self.reset_token_expires:
            return False
        return self.reset_token_expires > datetime.utcnow()
    
    @property
    def is_verification_token_valid(self) -> bool:
        """Check if email verification token is valid."""
        if not self.verification_token or not self.verification_token_expires:
            return False
        return self.verification_token_expires > datetime.utcnow()
    
    def get_id(self) -> str:
        """Get user ID as string."""
        return str(self.id) 