"""Service for audit log monitoring and maintenance."""
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy import func, and_, or_
from sqlalchemy.orm import Session

from app.db.models import AuditLog
from app.core.config import settings
from app.core.security import get_current_user
from app.schemas.audit import AuditLogSummary, UserActivity

class AuditMonitor:
    """Monitor and maintain audit logs."""

    def __init__(self, db: Session):
        """Initialize with database session."""
        self.db = db

    async def check_security_events(self, time_window: int = 5) -> List[Dict]:
        """
        Check for security-related events in the last X minutes.
        Returns list of security events that might need attention.
        """
        cutoff_time = datetime.utcnow() - timedelta(minutes=time_window)
        
        security_events = self.db.query(AuditLog).filter(
            and_(
                AuditLog.created_at >= cutoff_time,
                or_(
                    AuditLog.action.like("SECURITY_%"),
                    AuditLog.action.like("FAILED_AUTH_%"),
                    AuditLog.action == "PASSWORD_RESET_REQUESTED"
                )
            )
        ).all()

        return [
            {
                "id": str(event.id),
                "action": event.action,
                "details": event.details,
                "user_id": str(event.user_id) if event.user_id else None,
                "created_at": event.created_at.isoformat(),
                "severity": "HIGH" if "FAILED_AUTH" in event.action else "MEDIUM"
            }
            for event in security_events
        ]

    async def get_user_activity_alerts(
        self,
        time_window: int = 60,
        threshold: int = 50
    ) -> List[Dict]:
        """
        Check for unusual user activity in the last X minutes.
        Alerts if a user has more than threshold actions.
        """
        cutoff_time = datetime.utcnow() - timedelta(minutes=time_window)
        
        user_counts = self.db.query(
            AuditLog.user_id,
            func.count(AuditLog.id).label("action_count")
        ).filter(
            AuditLog.created_at >= cutoff_time,
            AuditLog.user_id.isnot(None)
        ).group_by(
            AuditLog.user_id
        ).having(
            func.count(AuditLog.id) > threshold
        ).all()

        return [
            {
                "user_id": str(user_id),
                "action_count": count,
                "time_window_minutes": time_window,
                "threshold": threshold
            }
            for user_id, count in user_counts
        ]

    async def cleanup_old_logs(self, retention_days: int = 90) -> int:
        """
        Remove audit logs older than retention_days.
        Returns number of logs deleted.
        """
        cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
        
        deleted_count = self.db.query(AuditLog).filter(
            AuditLog.created_at < cutoff_date
        ).delete()
        
        self.db.commit()
        return deleted_count

    async def get_failed_auth_summary(
        self,
        time_window: int = 60
    ) -> Dict[str, int]:
        """Get summary of failed authentication attempts."""
        cutoff_time = datetime.utcnow() - timedelta(minutes=time_window)
        
        failed_auth_counts = self.db.query(
            func.count(AuditLog.id)
        ).filter(
            and_(
                AuditLog.created_at >= cutoff_time,
                AuditLog.action.like("FAILED_AUTH_%")
            )
        ).scalar()

        unique_users = self.db.query(
            func.count(func.distinct(AuditLog.user_id))
        ).filter(
            and_(
                AuditLog.created_at >= cutoff_time,
                AuditLog.action.like("FAILED_AUTH_%"),
                AuditLog.user_id.isnot(None)
            )
        ).scalar()

        return {
            "total_failed_attempts": failed_auth_counts,
            "unique_users_affected": unique_users,
            "time_window_minutes": time_window
        }

    async def get_system_health_metrics(self) -> Dict:
        """Get system health metrics based on audit logs."""
        now = datetime.utcnow()
        last_hour = now - timedelta(hours=1)
        last_day = now - timedelta(days=1)

        # Get various metrics
        total_logs = self.db.query(func.count(AuditLog.id)).scalar()
        
        hourly_logs = self.db.query(
            func.count(AuditLog.id)
        ).filter(
            AuditLog.created_at >= last_hour
        ).scalar()
        
        daily_logs = self.db.query(
            func.count(AuditLog.id)
        ).filter(
            AuditLog.created_at >= last_day
        ).scalar()

        action_counts = dict(
            self.db.query(
                AuditLog.action,
                func.count(AuditLog.id)
            ).filter(
                AuditLog.created_at >= last_day
            ).group_by(
                AuditLog.action
            ).all()
        )

        return {
            "total_logs": total_logs,
            "logs_last_hour": hourly_logs,
            "logs_last_day": daily_logs,
            "action_distribution": action_counts,
            "timestamp": now.isoformat()
        }

    async def get_user_session_metrics(
        self,
        user_id: str,
        days: int = 7
    ) -> Dict:
        """Get session-related metrics for a specific user."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Get login/logout patterns
        login_events = self.db.query(AuditLog).filter(
            and_(
                AuditLog.user_id == user_id,
                AuditLog.created_at >= cutoff_date,
                AuditLog.action == "AUTH_LOGIN"
            )
        ).order_by(AuditLog.created_at.asc()).all()

        logout_events = self.db.query(AuditLog).filter(
            and_(
                AuditLog.user_id == user_id,
                AuditLog.created_at >= cutoff_date,
                AuditLog.action == "AUTH_LOGOUT"
            )
        ).order_by(AuditLog.created_at.asc()).all()

        # Calculate metrics
        total_sessions = len(login_events)
        failed_logins = self.db.query(func.count(AuditLog.id)).filter(
            and_(
                AuditLog.user_id == user_id,
                AuditLog.created_at >= cutoff_date,
                AuditLog.action == "FAILED_AUTH_LOGIN"
            )
        ).scalar()

        # Estimate average session duration
        session_durations = []
        for login, next_event in zip(login_events[:-1], login_events[1:]):
            duration = (next_event.created_at - login.created_at).total_seconds()
            if duration > 0:
                session_durations.append(duration)

        avg_duration = sum(session_durations) / len(session_durations) if session_durations else 0

        return {
            "user_id": user_id,
            "period_days": days,
            "total_sessions": total_sessions,
            "failed_login_attempts": failed_logins,
            "average_session_duration": avg_duration,
            "last_login": login_events[-1].created_at.isoformat() if login_events else None,
            "last_logout": logout_events[-1].created_at.isoformat() if logout_events else None
        } 