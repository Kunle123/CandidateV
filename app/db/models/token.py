"""Token models for handling refresh tokens and other authentication tokens."""
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .base import Base, UUIDMixin

class RefreshToken(Base, UUIDMixin):
    """Model for storing refresh tokens."""
    
    token = Column(String, unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    
    # Foreign key to user
    user_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Relationship back to user
    user = relationship("User", back_populates="refresh_tokens")
    
    # Device information
    device_id = Column(String, nullable=True)
    device_name = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    
    def __repr__(self) -> str:
        """String representation of the refresh token."""
        return f"<RefreshToken {self.id} for user {self.user_id}>"
    
    @property
    def is_valid(self) -> bool:
        """Check if the refresh token is valid."""
        return (
            not self.revoked 
            and self.expires_at > datetime.utcnow()
        )
    
    def revoke(self) -> None:
        """Revoke the refresh token."""
        self.revoked = True
        self.revoked_at = datetime.utcnow() 