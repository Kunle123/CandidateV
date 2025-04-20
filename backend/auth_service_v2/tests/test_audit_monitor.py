"""Tests for audit monitoring functionality."""
import pytest
from datetime import datetime, timedelta
from typing import Dict
from sqlalchemy.orm import Session

from app.services.audit_monitor import AuditMonitor
from app.services.user import create_user
from app.models.user import UserCreate
from app.core.security import get_password_hash
from app.db.models import AuditLog

@pytest.fixture
def audit_monitor(db_session: Session) -> AuditMonitor:
    """Create an AuditMonitor instance."""
    return AuditMonitor(db_session)

@pytest.fixture
async def test_security_events(db_session: Session, test_user: Dict):
    """Create test security events."""
    # Create test user
    test_user = dict(test_user)
    test_user["email"] = "security_monitor_test@example.com"
    test_user["password"] = get_password_hash(test_user["password"])
    user_in = UserCreate(**test_user)
    user = create_user(db_session, user_in)

    # Create various security events
    events = [
        ("SECURITY_SUSPICIOUS_IP", "Suspicious IP detected", user.id),
        ("FAILED_AUTH_LOGIN", "Failed login attempt", user.id),
        ("PASSWORD_RESET_REQUESTED", "Password reset requested", user.id),
        ("SECURITY_BRUTE_FORCE", "Brute force attempt detected", None)
    ]

    for action, details, user_id in events:
        log = AuditLog(
            action=action,
            details=details,
            user_id=user_id,
            created_at=datetime.utcnow()
        )
        db_session.add(log)
    
    db_session.commit()
    return user

@pytest.mark.asyncio
async def test_check_security_events(
    audit_monitor: AuditMonitor,
    test_security_events
):
    """Test security event monitoring."""
    events = await audit_monitor.check_security_events(time_window=5)
    
    assert len(events) >= 4  # At least our test events
    assert any(event["action"] == "SECURITY_SUSPICIOUS_IP" for event in events)
    assert any(event["action"] == "FAILED_AUTH_LOGIN" for event in events)
    
    # Check severity levels
    for event in events:
        if "FAILED_AUTH" in event["action"]:
            assert event["severity"] == "HIGH"
        else:
            assert event["severity"] == "MEDIUM"

@pytest.mark.asyncio
async def test_user_activity_alerts(
    audit_monitor: AuditMonitor,
    db_session: Session,
    test_user: Dict
):
    """Test user activity monitoring."""
    # Create test user
    test_user = dict(test_user)
    test_user["email"] = "activity_monitor_test@example.com"
    test_user["password"] = get_password_hash(test_user["password"])
    user_in = UserCreate(**test_user)
    user = create_user(db_session, user_in)

    # Create many events for this user
    for i in range(60):  # Create 60 events
        log = AuditLog(
            action=f"TEST_ACTION_{i}",
            details=f"Test action {i}",
            user_id=user.id,
            created_at=datetime.utcnow()
        )
        db_session.add(log)
    
    db_session.commit()

    # Test activity alerts
    alerts = await audit_monitor.get_user_activity_alerts(
        time_window=60,
        threshold=50
    )
    
    assert len(alerts) > 0
    alert = next(alert for alert in alerts if alert["user_id"] == str(user.id))
    assert alert["action_count"] >= 60
    assert alert["threshold"] == 50

@pytest.mark.asyncio
async def test_cleanup_old_logs(
    audit_monitor: AuditMonitor,
    db_session: Session
):
    """Test audit log cleanup functionality."""
    # Create old and new logs
    old_date = datetime.utcnow() - timedelta(days=100)
    new_date = datetime.utcnow()

    # Create old logs
    for i in range(5):
        log = AuditLog(
            action=f"OLD_ACTION_{i}",
            details=f"Old action {i}",
            created_at=old_date
        )
        db_session.add(log)

    # Create new logs
    for i in range(5):
        log = AuditLog(
            action=f"NEW_ACTION_{i}",
            details=f"New action {i}",
            created_at=new_date
        )
        db_session.add(log)

    db_session.commit()

    # Test cleanup
    deleted_count = await audit_monitor.cleanup_old_logs(retention_days=90)
    assert deleted_count >= 5  # Should delete at least our old logs

    # Verify old logs are gone
    remaining_logs = db_session.query(AuditLog).filter(
        AuditLog.action.like("OLD_ACTION_%")
    ).all()
    assert len(remaining_logs) == 0

    # Verify new logs remain
    remaining_logs = db_session.query(AuditLog).filter(
        AuditLog.action.like("NEW_ACTION_%")
    ).all()
    assert len(remaining_logs) == 5

@pytest.mark.asyncio
async def test_failed_auth_summary(
    audit_monitor: AuditMonitor,
    db_session: Session,
    test_user: Dict
):
    """Test failed authentication summary."""
    # Create test users
    users = []
    for i in range(3):
        user_data = dict(test_user)
        user_data["email"] = f"failed_auth_test_{i}@example.com"
        user_data["password"] = get_password_hash(user_data["password"])
        user_in = UserCreate(**user_data)
        users.append(create_user(db_session, user_in))

    # Create failed auth events
    for user in users:
        for _ in range(3):  # 3 failed attempts per user
            log = AuditLog(
                action="FAILED_AUTH_LOGIN",
                details="Failed login attempt",
                user_id=user.id,
                created_at=datetime.utcnow()
            )
            db_session.add(log)
    
    db_session.commit()

    # Test summary
    summary = await audit_monitor.get_failed_auth_summary(time_window=60)
    assert summary["total_failed_attempts"] >= 9  # At least our test events
    assert summary["unique_users_affected"] >= 3  # Our test users

@pytest.mark.asyncio
async def test_system_health_metrics(
    audit_monitor: AuditMonitor,
    db_session: Session
):
    """Test system health metrics collection."""
    # Create various events across different times
    now = datetime.utcnow()
    
    # Create events in the last hour
    for i in range(10):
        log = AuditLog(
            action="RECENT_ACTION",
            details=f"Recent action {i}",
            created_at=now - timedelta(minutes=30)
        )
        db_session.add(log)

    # Create events from earlier today
    for i in range(20):
        log = AuditLog(
            action="TODAY_ACTION",
            details=f"Today's action {i}",
            created_at=now - timedelta(hours=4)
        )
        db_session.add(log)

    db_session.commit()

    # Test metrics
    metrics = await audit_monitor.get_system_health_metrics()
    
    assert metrics["logs_last_hour"] >= 10  # At least our recent events
    assert metrics["logs_last_day"] >= 30   # At least all our test events
    assert "RECENT_ACTION" in metrics["action_distribution"]
    assert "TODAY_ACTION" in metrics["action_distribution"]

@pytest.mark.asyncio
async def test_user_session_metrics(
    audit_monitor: AuditMonitor,
    db_session: Session,
    test_user: Dict
):
    """Test user session metrics calculation."""
    # Create test user
    test_user = dict(test_user)
    test_user["email"] = "session_metrics_test@example.com"
    test_user["password"] = get_password_hash(test_user["password"])
    user_in = UserCreate(**test_user)
    user = create_user(db_session, user_in)

    # Create session events
    now = datetime.utcnow()
    
    # Create login/logout pairs
    for i in range(3):
        # Login event
        login = AuditLog(
            action="AUTH_LOGIN",
            details="User logged in",
            user_id=user.id,
            created_at=now - timedelta(days=1, hours=i*4)
        )
        db_session.add(login)

        # Logout event
        logout = AuditLog(
            action="AUTH_LOGOUT",
            details="User logged out",
            user_id=user.id,
            created_at=now - timedelta(days=1, hours=i*4+2)  # 2 hour session
        )
        db_session.add(logout)

    # Add some failed login attempts
    for i in range(2):
        failed = AuditLog(
            action="FAILED_AUTH_LOGIN",
            details="Failed login attempt",
            user_id=user.id,
            created_at=now - timedelta(days=1, hours=i)
        )
        db_session.add(failed)

    db_session.commit()

    # Test metrics
    metrics = await audit_monitor.get_user_session_metrics(
        user_id=str(user.id),
        days=7
    )
    
    assert metrics["total_sessions"] == 3
    assert metrics["failed_login_attempts"] == 2
    assert 7000 <= metrics["average_session_duration"] <= 7300  # ~2 hours in seconds
    assert metrics["last_login"] is not None
    assert metrics["last_logout"] is not None 