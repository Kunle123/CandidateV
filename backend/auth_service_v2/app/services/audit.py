"""Audit logging service."""
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import Request

from app.db.models import AuditLog, User

async def create_audit_log(
    db: Session,
    action: str,
    details: str,
    user: Optional[User] = None,
    request: Optional[Request] = None
) -> AuditLog:
    """Create an audit log entry."""
    audit_log = AuditLog(
        action=action,
        details=details,
        user_id=user.id if user else None,
        created_at=datetime.now(timezone.utc)
    )

    if request:
        # Extract user agent
        audit_log.user_agent = request.headers.get("user-agent")
        
        # Safely extract IP address from various possible sources
        ip_address = None
        if hasattr(request, "client") and request.client:
            ip_address = request.client.host
        if not ip_address:
            ip_address = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        if not ip_address:
            ip_address = request.headers.get("x-real-ip")
        
        audit_log.ip_address = ip_address

    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)

    return audit_log

async def log_auth_event(
    db: Session,
    event_type: str,
    user: Optional[User] = None,
    details: str = "",
    request: Optional[Request] = None,
    success: bool = True
) -> AuditLog:
    """Log authentication-related events."""
    action = f"AUTH_{event_type}"
    if not success:
        action = f"FAILED_{action}"
    
    full_details = {
        "event": event_type,
        "success": success,
        "details": details,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    return await create_audit_log(
        db=db,
        action=action,
        details=str(full_details),
        user=user,
        request=request
    )

async def log_user_event(
    db: Session,
    event_type: str,
    user: User,
    target_user_id: Optional[str] = None,
    details: str = "",
    request: Optional[Request] = None
) -> AuditLog:
    """Log user-related events (create, update, delete, etc.)."""
    action = f"USER_{event_type}"
    
    full_details = {
        "event": event_type,
        "target_user_id": target_user_id,
        "details": details,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    return await create_audit_log(
        db=db,
        action=action,
        details=str(full_details),
        user=user,
        request=request
    )

async def log_admin_event(
    db: Session,
    event_type: str,
    admin_user: User,
    details: str = "",
    request: Optional[Request] = None
) -> AuditLog:
    """Log administrative actions."""
    action = f"ADMIN_{event_type}"
    
    full_details = {
        "event": event_type,
        "admin_id": str(admin_user.id),
        "details": details,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    return await create_audit_log(
        db=db,
        action=action,
        details=str(full_details),
        user=admin_user,
        request=request
    )

async def log_security_event(
    db: Session,
    event_type: str,
    details: str = "",
    user: Optional[User] = None,
    request: Optional[Request] = None
) -> AuditLog:
    """Log security-related events (rate limiting, suspicious activity, etc.)."""
    action = f"SECURITY_{event_type}"
    
    full_details = {
        "event": event_type,
        "details": details,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    return await create_audit_log(
        db=db,
        action=action,
        details=str(full_details),
        user=user,
        request=request
    ) 