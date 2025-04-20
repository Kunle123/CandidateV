"""Admin endpoints for user management and audit logs."""
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from starlette.status import HTTP_404_NOT_FOUND

from app.api.deps.auth import get_current_active_superuser
from app.api.deps.db import get_db
from app.models.user import User, UserCreate, UserUpdate
from app.db.models import AuditLog as DbAuditLog
from app.models.audit import AuditLog, AuditLogSummary, UserActivity
from app.services.user import (
    create_user,
    get_user,
    get_users,
    update_user,
    add_user_role,
    remove_user_role
)

router = APIRouter()

@router.get("/users", response_model=List[User])
async def list_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    role: Optional[str] = None,
    current_user: User = Depends(get_current_active_superuser)
) -> List[User]:
    """
    Retrieve users.
    Only accessible by superusers.
    """
    return get_users(db, skip=skip, limit=limit, role=role)

@router.post("/users", response_model=User)
async def create_new_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> User:
    """
    Create new user.
    Only accessible by superusers.
    """
    return create_user(db, user_in)

@router.get("/users/{user_id}", response_model=User)
async def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> User:
    """
    Get user by ID.
    Only accessible by superusers.
    """
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.put("/users/{user_id}", response_model=User)
async def update_user_by_id(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> User:
    """
    Update user.
    Only accessible by superusers.
    """
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return update_user(db, user, user_in)

@router.post("/users/{user_id}/roles/{role}", response_model=User)
async def add_role_to_user(
    user_id: int,
    role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> User:
    """
    Add role to user.
    Only accessible by superusers.
    """
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return add_user_role(db, user, role)

@router.delete("/users/{user_id}/roles/{role}", response_model=User)
async def remove_role_from_user(
    user_id: int,
    role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> User:
    """
    Remove role from user.
    Only accessible by superusers.
    """
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return remove_user_role(db, user, role)

@router.get("/audit-logs", response_model=List[AuditLog])
async def list_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
    skip: int = 0,
    limit: int = 100,
    action_type: Optional[str] = None,
    user_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> List[AuditLog]:
    """
    Retrieve audit logs with optional filtering.
    Only accessible by superusers.
    """
    query = db.query(DbAuditLog)
    
    if action_type:
        query = query.filter(DbAuditLog.action.startswith(action_type))
    
    if user_id:
        query = query.filter(DbAuditLog.user_id == user_id)
    
    if start_date:
        query = query.filter(DbAuditLog.created_at >= start_date)
    
    if end_date:
        query = query.filter(DbAuditLog.created_at <= end_date)
    
    # Order by most recent first
    query = query.order_by(DbAuditLog.created_at.desc())
    
    return query.offset(skip).limit(limit).all()

@router.get("/audit-logs/summary", response_model=AuditLogSummary)
async def get_audit_logs_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
    days: int = Query(default=7, ge=1, le=30)
) -> AuditLogSummary:
    """
    Get summary of audit logs for the specified number of days.
    Only accessible by superusers.
    """
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get total counts by action type
    query = db.query(DbAuditLog.action, db.func.count(DbAuditLog.id)).\
        filter(DbAuditLog.created_at >= start_date).\
        group_by(DbAuditLog.action)
    
    action_counts = {action: count for action, count in query.all()}
    
    # Get counts of failed auth attempts
    failed_auth_count = db.query(DbAuditLog).\
        filter(DbAuditLog.action.like("FAILED_AUTH_%")).\
        filter(DbAuditLog.created_at >= start_date).\
        count()
    
    # Get most active users
    user_activity = db.query(
        DbAuditLog.user_id,
        db.func.count(DbAuditLog.id).label("activity_count")
    ).\
        filter(DbAuditLog.user_id.isnot(None)).\
        filter(DbAuditLog.created_at >= start_date).\
        group_by(DbAuditLog.user_id).\
        order_by(db.text("activity_count DESC")).\
        limit(5).\
        all()
    
    return AuditLogSummary(
        period_days=days,
        total_events=sum(action_counts.values()),
        action_counts=action_counts,
        failed_auth_attempts=failed_auth_count,
        most_active_users=[UserActivity(user_id=str(user_id), event_count=count) for user_id, count in user_activity]
    )

@router.get("/audit-logs/security")
async def get_security_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
    hours: int = Query(default=24, ge=1, le=72)
) -> List[AuditLog]:
    """
    Get recent security-related events.
    Only accessible by superusers.
    """
    start_date = datetime.utcnow() - timedelta(hours=hours)
    
    return db.query(DbAuditLog).\
        filter(DbAuditLog.action.like("SECURITY_%")).\
        filter(DbAuditLog.created_at >= start_date).\
        order_by(DbAuditLog.created_at.desc()).\
        all() 