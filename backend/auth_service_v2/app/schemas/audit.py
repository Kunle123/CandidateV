"""Audit schemas for the auth service."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class UserActivity(BaseModel):
    """User activity schema."""
    user_id: str
    action: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    details: Optional[dict] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class AuditLogSummary(BaseModel):
    """Audit log summary schema."""
    total_activities: int
    activities: List[UserActivity]
    start_date: datetime
    end_date: datetime 