"""Base model class with common fields and functionality."""
from datetime import datetime
import uuid
from typing import Any

from sqlalchemy import Column, DateTime
from sqlalchemy.ext.declarative import as_declarative, declared_attr
from sqlalchemy.dialects.postgresql import UUID

@as_declarative()
class Base:
    """Base class for all database models."""
    
    # Make id column optional since not all tables might need it
    id: Any
    
    # Generate __tablename__ automatically
    @declared_attr
    def __tablename__(cls) -> str:
        """Generate table name automatically from class name."""
        return cls.__name__.lower()
    
    # Common columns for all tables
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow, 
        nullable=False
    )

class UUIDMixin:
    """Mixin to add UUID primary key to models."""
    
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        unique=True,
        nullable=False
    ) 