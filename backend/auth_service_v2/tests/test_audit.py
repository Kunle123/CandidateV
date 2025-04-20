"""Tests for audit logging functionality."""
import pytest
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import Request
from fastapi.testclient import TestClient
from sqlalchemy.exc import SQLAlchemyError
from uuid import uuid4
import asyncio

from app.services.audit import (
    create_audit_log,
    log_auth_event,
    log_user_event,
    log_admin_event,
    log_security_event
)
from app.services.user import create_user
from app.core.security import get_password_hash
from app.models.user import UserCreate

@pytest.mark.asyncio
async def test_create_audit_log(db_session: Session):
    """Test basic audit log creation."""
    audit_log = await create_audit_log(
        db=db_session,
        action="TEST_ACTION",
        details="Test details",
        user=None,
        request=None
    )
    
    assert audit_log.id is not None
    assert audit_log.action == "TEST_ACTION"
    assert audit_log.details == "Test details"
    assert audit_log.created_at is not None

@pytest.mark.asyncio
async def test_create_audit_log_with_error(db_session: Session, monkeypatch):
    """Test audit log creation with database error handling."""
    def mock_commit():
        raise SQLAlchemyError("Database error")
    
    # Patch the commit method to raise an error
    monkeypatch.setattr(db_session, "commit", mock_commit)
    
    with pytest.raises(SQLAlchemyError):
        await create_audit_log(
            db=db_session,
            action="TEST_ACTION",
            details="Test details"
        )

@pytest.mark.asyncio
async def test_log_auth_event_success(db_session: Session, test_user):
    """Test logging successful authentication events."""
    # Create test user
    test_user = dict(test_user)
    test_user["email"] = "auth_success_test@example.com"
    test_user["password"] = get_password_hash(test_user["password"])
    user_in = UserCreate(**test_user)
    user = create_user(db_session, user_in)

    # Test successful login
    audit_log = await log_auth_event(
        db=db_session,
        event_type="LOGIN",
        user=user,
        details="User logged in successfully",
        success=True
    )

    assert audit_log.action == "AUTH_LOGIN"
    assert audit_log.user_id == user.id
    assert "success" in audit_log.details.lower()

@pytest.mark.asyncio
async def test_log_auth_event_failure(db_session: Session):
    """Test logging failed authentication events."""
    audit_log = await log_auth_event(
        db=db_session,
        event_type="LOGIN",
        details="Invalid credentials",
        success=False
    )

    assert audit_log.action == "FAILED_AUTH_LOGIN"
    assert audit_log.user_id is None
    assert "invalid credentials" in audit_log.details.lower()

@pytest.mark.asyncio
async def test_log_user_event(db_session: Session, test_user):
    """Test logging user-related events."""
    # Create test user with unique email
    test_user = dict(test_user)
    test_user["email"] = "user_event_test@example.com"
    test_user["password"] = get_password_hash(test_user["password"])
    user_in = UserCreate(**test_user)
    user = create_user(db_session, user_in)

    # Test user creation event
    audit_log = await log_user_event(
        db=db_session,
        event_type="CREATED",
        user=user,
        details=f"User {user.email} created"
    )

    assert audit_log.action == "USER_CREATED"
    assert audit_log.user_id == user.id
    assert user.email in audit_log.details

@pytest.mark.asyncio
async def test_log_user_event_with_target(db_session: Session, test_user):
    """Test logging user events with target user."""
    # Create admin user
    admin_user = dict(test_user)
    admin_user["email"] = "admin_user_event_test@example.com"
    admin_user["password"] = get_password_hash(admin_user["password"])
    admin_in = UserCreate(**admin_user)
    admin = create_user(db_session, admin_in)

    # Create target user
    target_user = dict(test_user)
    target_user["email"] = "target_user_event_test@example.com"
    target_user["password"] = get_password_hash(target_user["password"])
    target_in = UserCreate(**target_user)
    target = create_user(db_session, target_in)

    # Log user update event
    audit_log = await log_user_event(
        db=db_session,
        event_type="UPDATED",
        user=admin,
        target_user_id=str(target.id),
        details=f"Updated user {target.email}"
    )

    assert audit_log.action == "USER_UPDATED"
    assert audit_log.user_id == admin.id
    assert str(target.id) in audit_log.details

@pytest.mark.asyncio
async def test_log_admin_event(db_session: Session, test_superuser):
    """Test logging administrative actions."""
    # Create superuser
    test_superuser = dict(test_superuser)
    test_superuser["email"] = "admin_event_test@example.com"
    test_superuser["password"] = get_password_hash(test_superuser["password"])
    user_in = UserCreate(**test_superuser)
    admin = create_user(db_session, user_in)

    # Test user deletion event
    audit_log = await log_admin_event(
        db=db_session,
        event_type="USER_DELETE",
        admin_user=admin,
        details="Deleted user account"
    )

    assert audit_log.action == "ADMIN_USER_DELETE"
    assert audit_log.user_id == admin.id
    assert str(admin.id) in audit_log.details

@pytest.mark.asyncio
async def test_log_admin_event_with_request(db_session: Session, test_superuser, client: TestClient):
    """Test logging admin events with request information."""
    # Create superuser with unique email
    test_superuser = dict(test_superuser)
    test_superuser["email"] = "admin_request_test@example.com"
    test_superuser["password"] = get_password_hash(test_superuser["password"])
    user_in = UserCreate(**test_superuser)
    admin = create_user(db_session, user_in)

    # Create mock request with custom headers
    headers = {
        "user-agent": "Test Browser 1.0",
        "x-forwarded-for": "192.168.1.1",
        "x-real-ip": "192.168.1.1"
    }

    response = client.get("/api/v1/health", headers=headers)
    request = response._request

    # Log admin action with request
    audit_log = await log_admin_event(
        db=db_session,
        event_type="SETTINGS_UPDATE",
        admin_user=admin,
        details="Updated system settings",
        request=request
    )

    assert audit_log.action == "ADMIN_SETTINGS_UPDATE"
    assert audit_log.user_id == admin.id
    assert audit_log.ip_address == "192.168.1.1"
    assert audit_log.user_agent == "Test Browser 1.0"

@pytest.mark.asyncio
async def test_log_security_event(db_session: Session):
    """Test logging security events."""
    # Test rate limiting event
    audit_log = await log_security_event(
        db=db_session,
        event_type="RATE_LIMIT",
        details="Too many login attempts"
    )
    
    assert audit_log.action == "SECURITY_RATE_LIMIT"
    assert "too many login attempts" in audit_log.details.lower()
    assert audit_log.user_id is None

@pytest.mark.asyncio
async def test_log_security_event_with_user(db_session: Session, test_user):
    """Test logging security events with associated user."""
    # Create test user with unique email
    test_user = dict(test_user)
    test_user["email"] = "security_event_test@example.com"
    test_user["password"] = get_password_hash(test_user["password"])
    user_in = UserCreate(**test_user)
    user = create_user(db_session, user_in)

    # Test suspicious activity event
    audit_log = await log_security_event(
        db=db_session,
        event_type="SUSPICIOUS_ACTIVITY",
        details="Multiple failed 2FA attempts",
        user=user
    )

    assert audit_log.action == "SECURITY_SUSPICIOUS_ACTIVITY"
    assert audit_log.user_id == user.id
    assert "multiple failed 2fa attempts" in audit_log.details.lower()

@pytest.mark.asyncio
async def test_audit_log_with_request(db_session: Session, client: TestClient):
    """Test audit logging with request information."""
    # Create mock request with custom headers
    headers = {
        "user-agent": "Test Browser 1.0",
        "x-forwarded-for": "192.168.1.1"
    }

    response = client.get("/api/v1/health", headers=headers)
    request = response._request

    # Create audit log with request
    audit_log = await create_audit_log(
        db=db_session,
        action="TEST_WITH_REQUEST",
        details="Test with request info",
        request=request
    )

    assert audit_log.action == "TEST_WITH_REQUEST"
    assert audit_log.user_agent == "Test Browser 1.0"
    assert hasattr(audit_log, "ip_address")

@pytest.mark.asyncio
async def test_audit_log_timestamps(db_session: Session):
    """Test audit log timestamp handling."""
    before = datetime.now(timezone.utc)

    audit_log = await create_audit_log(
        db=db_session,
        action="TEST_TIMESTAMPS",
        details="Test timestamp handling"
    )

    after = datetime.now(timezone.utc)

    assert before <= audit_log.created_at <= after 

@pytest.mark.asyncio
async def test_audit_log_with_malformed_request(db_session: Session):
    """Test audit logging with malformed request object."""
    # Create a minimal request-like object missing common attributes
    class MinimalRequest:
        def __init__(self):
            self.client = None
            self.headers = {}

    minimal_request = MinimalRequest()

    # Test that audit logging handles missing request attributes gracefully
    audit_log = await create_audit_log(
        db=db_session,
        action="TEST_ACTION",
        details="Test with malformed request",
        request=minimal_request
    )

    assert audit_log.id is not None
    assert audit_log.action == "TEST_ACTION"
    assert audit_log.ip_address is None  # Should handle missing IP gracefully
    assert audit_log.user_agent is None  # Should handle missing user agent gracefully

@pytest.mark.asyncio
async def test_audit_log_with_invalid_user_id(db_session: Session):
    """Test audit logging with non-existent user ID."""
    non_existent_user_id = str(uuid4())

    audit_log = await log_user_event(
        db=db_session,
        event_type="UPDATED",
        user=None,
        target_user_id=non_existent_user_id,
        details=f"Attempted action on non-existent user {non_existent_user_id}"
    )

    assert audit_log.action == "USER_UPDATED"
    assert audit_log.user_id is None
    assert non_existent_user_id in audit_log.details

@pytest.mark.asyncio
async def test_concurrent_audit_logging(db_session: Session, test_user):
    """Test concurrent audit log creation."""
    # Create test user
    test_user = dict(test_user)
    test_user["email"] = "concurrent_test@example.com"
    test_user["password"] = get_password_hash(test_user["password"])
    user_in = UserCreate(**test_user)
    user = create_user(db_session, user_in)

    # Create multiple audit logs concurrently
    async def create_log(index: int):
        return await create_audit_log(
            db=db_session,
            action=f"CONCURRENT_TEST_{index}",
            details=f"Concurrent test log {index}",
            user=user
        )

    # Create 5 concurrent audit logs
    tasks = [create_log(i) for i in range(5)]
    audit_logs = await asyncio.gather(*tasks)

    # Verify all logs were created successfully
    assert len(audit_logs) == 5
    for i, log in enumerate(audit_logs):
        assert log.id is not None
        assert log.action == f"CONCURRENT_TEST_{i}"
        assert log.user_id == user.id

@pytest.mark.asyncio
async def test_audit_log_with_large_details(db_session: Session):
    """Test audit logging with large detail payload."""
    # Create a large details object
    large_details = {
        "data": "x" * 5000,  # 5KB of data
        "nested": {
            "array": list(range(1000)),
            "metadata": {
                "timestamp": str(datetime.now(timezone.utc)),
                "source": "test",
                "type": "large_payload"
            }
        }
    }

    audit_log = await create_audit_log(
        db=db_session,
        action="LARGE_DETAILS_TEST",
        details=large_details
    )

    assert audit_log.id is not None
    assert audit_log.action == "LARGE_DETAILS_TEST"
    assert audit_log.details == large_details  # Verify large payload was stored correctly

@pytest.mark.asyncio
async def test_audit_log_with_special_characters(db_session: Session):
    """Test audit logging with special characters in details."""
    special_chars = {
        "unicode": "🚀 测试 тест",
        "sql_injection": "'; DROP TABLE users; --",
        "html": "<script>alert('test')</script>",
        "newlines": "Line 1\nLine 2\rLine 3\r\nLine 4"
    }

    audit_log = await create_audit_log(
        db=db_session,
        action="SPECIAL_CHARS_TEST",
        details=special_chars
    )

    assert audit_log.id is not None
    assert audit_log.action == "SPECIAL_CHARS_TEST"
    assert audit_log.details == special_chars  # Verify special characters were stored correctly 