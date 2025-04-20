"""Contract tests for validating audit logging functionality."""
import pytest
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient
from app.core.security import get_password_hash
from app.services.user import create_user
from app.services.audit import (
    create_audit_log,
    log_auth_event,
    log_user_event,
    log_admin_event,
    log_security_event
)

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
async def test_log_auth_event(db_session: Session, test_user):
    """Test logging authentication events."""
    # Create test user
    test_user["password"] = get_password_hash(test_user["password"])
    user = create_user(db_session, test_user)

    # Test successful login
    audit_log = await log_auth_event(
        db=db_session,
        event_type="LOGIN",
        user=user,
        details="Successful login",
        success=True
    )

    assert audit_log.action == "AUTH_LOGIN"
    assert "success" in audit_log.details.lower()
    assert audit_log.user_id == user.id

    # Test failed login
    audit_log = await log_auth_event(
        db=db_session,
        event_type="LOGIN",
        details="Invalid password",
        success=False
    )

    assert audit_log.action == "FAILED_AUTH_LOGIN"
    assert "invalid password" in audit_log.details.lower()
    assert audit_log.user_id is None

@pytest.mark.asyncio
async def test_log_user_event(db_session: Session, test_user):
    """Test logging user-related events."""
    # Create test user
    test_user["password"] = get_password_hash(test_user["password"])
    user = create_user(db_session, test_user)

    # Test user update event
    audit_log = await log_user_event(
        db=db_session,
        event_type="UPDATE",
        user=user,
        details="Updated user profile"
    )

    assert audit_log.action == "USER_UPDATE"
    assert audit_log.user_id == user.id
    assert "updated user profile" in audit_log.details.lower()

@pytest.mark.asyncio
async def test_log_admin_event(db_session: Session, test_superuser):
    """Test logging administrative actions."""
    # Create superuser
    test_superuser["password"] = get_password_hash(test_superuser["password"])
    admin = create_user(db_session, test_superuser)

    # Test admin action
    audit_log = await log_admin_event(
        db=db_session,
        event_type="USER_DELETE",
        admin_user=admin,
        details="Deleted user account"
    )

    assert audit_log.action == "ADMIN_USER_DELETE"
    assert audit_log.user_id == admin.id
    assert "deleted user account" in audit_log.details.lower()

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

    assert audit_log.user_agent == "Test Browser 1.0"
    assert audit_log.ip_address is not None

@pytest.mark.asyncio
async def test_audit_log_timestamps(db_session: Session):
    """Test audit log timestamp handling."""
    before = datetime.utcnow()

    audit_log = await create_audit_log(
        db=db_session,
        action="TEST_TIMESTAMPS",
        details="Test timestamp handling"
    )

    after = datetime.utcnow()

    assert before <= audit_log.created_at <= after 