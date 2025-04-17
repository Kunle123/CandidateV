from sqlalchemy import Column, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
import uuid
import os

Base = declarative_base()

# Determine if using SQLite
is_sqlite = os.getenv("DATABASE_URL", "").startswith('sqlite:')

class UserProfile(Base):
    __tablename__ = "user_profiles"

    # Use different column types based on database
    if is_sqlite:
        # SQLite version (no UUID support)
        id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
        # Use JSON instead of JSONB for SQLite
        social_links = Column(String, nullable=True)  # Store as JSON string
        preferences = Column(String, nullable=True)  # Store as JSON string
    else:
        # PostgreSQL version
        from sqlalchemy.dialects.postgresql import UUID
        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        social_links = Column(JSONB, nullable=True)
        preferences = Column(JSONB, nullable=True)
    
    # Common columns
    bio = Column(Text, nullable=True)
    profile_image_url = Column(String(255), nullable=True)
    job_title = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()) 