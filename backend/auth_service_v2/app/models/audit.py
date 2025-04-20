from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, UUID4

class AuditLogBase(BaseModel):
    action: str
    details: Dict
    user_id: Optional[UUID4] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class AuditLogCreate(AuditLogBase):
    pass

class AuditLog(AuditLogBase):
    id: UUID4
    created_at: datetime

    class Config:
        from_attributes = True

class UserActivity(BaseModel):
    user_id: str
    event_count: int

class AuditLogSummary(BaseModel):
    period_days: int
    total_events: int
    action_counts: Dict[str, int]
    failed_auth_attempts: int
    most_active_users: List[UserActivity]

    class Config:
        from_attributes = True 