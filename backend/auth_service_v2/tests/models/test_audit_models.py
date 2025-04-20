"""Tests for audit models."""
import pytest
from datetime import datetime
from uuid import UUID, uuid4
from pydantic import ValidationError

from app.models.audit import (
    AuditLogBase,
    AuditLogCreate,
    AuditLog,
    UserActivity,
    AuditLogSummary
)

def test_audit_log_base():
    """Test AuditLogBase model."""
    # Test with minimum required fields
    audit_log = AuditLogBase(
        action="TEST_ACTION",
        details={"test": "value"}
    )
    assert audit_log.action == "TEST_ACTION"
    assert audit_log.details == {"test": "value"}
    assert audit_log.user_id is None
    assert audit_log.ip_address is None
    assert audit_log.user_agent is None

    # Test with all fields
    user_id = uuid4()
    audit_log = AuditLogBase(
        action="TEST_ACTION",
        details={"test": "value"},
        user_id=user_id,
        ip_address="192.168.1.1",
        user_agent="Test Browser 1.0"
    )
    assert audit_log.action == "TEST_ACTION"
    assert audit_log.details == {"test": "value"}
    assert audit_log.user_id == user_id
    assert audit_log.ip_address == "192.168.1.1"
    assert audit_log.user_agent == "Test Browser 1.0"

    # Test validation errors
    with pytest.raises(ValidationError):
        AuditLogBase(
            details={"test": "value"}  # Missing required action field
        )

    with pytest.raises(ValidationError):
        AuditLogBase(
            action="TEST_ACTION"  # Missing required details field
        )

def test_audit_log_create():
    """Test AuditLogCreate model."""
    # Test inheritance from AuditLogBase
    audit_log = AuditLogCreate(
        action="TEST_ACTION",
        details={"test": "value"}
    )
    assert isinstance(audit_log, AuditLogBase)
    assert audit_log.action == "TEST_ACTION"
    assert audit_log.details == {"test": "value"}

def test_audit_log():
    """Test AuditLog model."""
    # Test with all fields
    log_id = uuid4()
    now = datetime.utcnow()
    user_id = uuid4()

    audit_log = AuditLog(
        id=log_id,
        action="TEST_ACTION",
        details={"test": "value"},
        user_id=user_id,
        ip_address="192.168.1.1",
        user_agent="Test Browser 1.0",
        created_at=now
    )

    assert audit_log.id == log_id
    assert audit_log.action == "TEST_ACTION"
    assert audit_log.details == {"test": "value"}
    assert audit_log.user_id == user_id
    assert audit_log.ip_address == "192.168.1.1"
    assert audit_log.user_agent == "Test Browser 1.0"
    assert audit_log.created_at == now

    # Test validation errors
    with pytest.raises(ValidationError):
        AuditLog(
            action="TEST_ACTION",
            details={"test": "value"}
            # Missing required id field
        )

def test_user_activity():
    """Test UserActivity model."""
    # Test valid data
    activity = UserActivity(
        user_id="test-user-123",
        event_count=5
    )
    assert activity.user_id == "test-user-123"
    assert activity.event_count == 5

    # Test validation errors
    with pytest.raises(ValidationError):
        UserActivity(
            user_id="test-user-123"
            # Missing required event_count field
        )

    with pytest.raises(ValidationError):
        UserActivity(
            user_id="test-user-123",
            event_count="not-a-number"  # Invalid type for event_count
        )

def test_audit_log_summary():
    """Test AuditLogSummary model."""
    # Test valid data
    summary = AuditLogSummary(
        period_days=7,
        total_events=100,
        action_counts={
            "LOGIN": 50,
            "LOGOUT": 30,
            "UPDATE": 20
        },
        failed_auth_attempts=5,
        most_active_users=[
            UserActivity(user_id="user1", event_count=30),
            UserActivity(user_id="user2", event_count=20)
        ]
    )

    assert summary.period_days == 7
    assert summary.total_events == 100
    assert summary.action_counts == {
        "LOGIN": 50,
        "LOGOUT": 30,
        "UPDATE": 20
    }
    assert summary.failed_auth_attempts == 5
    assert len(summary.most_active_users) == 2
    assert summary.most_active_users[0].user_id == "user1"
    assert summary.most_active_users[0].event_count == 30

    # Test validation errors
    with pytest.raises(ValidationError):
        AuditLogSummary(
            period_days=7,
            total_events=100,
            action_counts={
                "LOGIN": {"invalid": "value"}  # Invalid type for count
            },
            failed_auth_attempts=5,
            most_active_users=[]
        )

    with pytest.raises(ValidationError):
        AuditLogSummary(
            period_days="invalid",  # Invalid type for period_days
            total_events=100,
            action_counts={
                "LOGIN": 50
            },
            failed_auth_attempts=5,
            most_active_users=[]
        ) 