"""Integration tests for audit logging with other services."""
import pytest
from datetime import datetime, timedelta
from typing import Dict
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

from app.core.security import create_access_token, get_password_hash
from app.services.user import create_user
from app.services.auth import authenticate_user
from app.models.user import UserCreate
from app.db.models import AuditLog

@pytest.mark.integration
@pytest.mark.asyncio
async def test_user_service_audit_integration(
    client: TestClient,
    db_session: Session,
    test_user: Dict
):
    """Test audit logging integration with user service operations."""
    # Test user creation audit
    test_user = dict(test_user)
    test_user["email"] = "integration_test@example.com"
    response = client.post(
        "/api/v1/users",
        json={
            "email": test_user["email"],
            "password": "testpassword123",
            "name": "Integration Test User"
        }
    )
    assert response.status_code == 201

    # Verify user creation audit log
    logs = db_session.query(AuditLog).filter(
        AuditLog.action == "USER_CREATED"
    ).all()
    assert any(test_user["email"] in log.details for log in logs)

    # Test user update audit
    access_token = create_access_token(subject=test_user["email"])
    headers = {"Authorization": f"Bearer {access_token}"}
    
    response = client.put(
        "/api/v1/users/me",
        headers=headers,
        json={"name": "Updated Name"}
    )
    assert response.status_code == 200

    # Verify user update audit log
    logs = db_session.query(AuditLog).filter(
        AuditLog.action == "USER_UPDATED"
    ).all()
    assert any("Updated Name" in str(log.details) for log in logs)

@pytest.mark.integration
@pytest.mark.asyncio
async def test_auth_flow_audit_integration(
    client: TestClient,
    db_session: Session,
    test_user: Dict
):
    """Test audit logging integration with authentication flows."""
    # Create test user
    test_user = dict(test_user)
    test_user["email"] = "auth_flow_test@example.com"
    test_user["password"] = "testpassword123"
    user_in = UserCreate(
        email=test_user["email"],
        password=get_password_hash(test_user["password"]),
        name="Auth Flow Test User"
    )
    user = create_user(db_session, user_in)

    # Test login flow
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": test_user["email"],
            "password": test_user["password"]
        }
    )
    assert response.status_code == 200

    # Verify login audit log
    logs = db_session.query(AuditLog).filter(
        AuditLog.action == "AUTH_LOGIN",
        AuditLog.user_id == user.id
    ).all()
    assert len(logs) > 0
    assert any("success" in str(log.details).lower() for log in logs)

    # Test failed login attempt
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": test_user["email"],
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401

    # Verify failed login audit log
    logs = db_session.query(AuditLog).filter(
        AuditLog.action == "FAILED_AUTH_LOGIN"
    ).all()
    assert len(logs) > 0
    assert any(test_user["email"] in str(log.details) for log in logs)

@pytest.mark.integration
@pytest.mark.asyncio
async def test_password_reset_audit_integration(
    client: TestClient,
    db_session: Session,
    test_user: Dict
):
    """Test audit logging integration with password reset flow."""
    # Create test user
    test_user = dict(test_user)
    test_user["email"] = "pwd_reset_test@example.com"
    user_in = UserCreate(**test_user)
    user = create_user(db_session, user_in)

    # Request password reset
    response = client.post(
        "/api/v1/auth/password-reset",
        json={"email": test_user["email"]}
    )
    assert response.status_code == 200

    # Verify password reset request audit log
    logs = db_session.query(AuditLog).filter(
        AuditLog.action == "PASSWORD_RESET_REQUESTED",
        AuditLog.user_id == user.id
    ).all()
    assert len(logs) > 0

@pytest.mark.integration
@pytest.mark.asyncio
async def test_cross_service_audit_trail(
    client: TestClient,
    db_session: Session,
    test_user: Dict,
    admin_headers: Dict[str, str]
):
    """Test complete audit trail across multiple service interactions."""
    # Create test user
    test_user = dict(test_user)
    test_user["email"] = "audit_trail_test@example.com"
    test_user["password"] = "testpassword123"
    
    # 1. User Creation
    response = client.post(
        "/api/v1/users",
        json={
            "email": test_user["email"],
            "password": test_user["password"],
            "name": "Audit Trail Test User"
        }
    )
    assert response.status_code == 201
    user_id = response.json()["id"]

    # 2. User Login
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": test_user["email"],
            "password": test_user["password"]
        }
    )
    assert response.status_code == 200
    tokens = response.json()
    user_headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    # 3. Profile Update
    response = client.put(
        "/api/v1/users/me",
        headers=user_headers,
        json={"name": "Updated Trail User"}
    )
    assert response.status_code == 200

    # 4. Password Change
    response = client.post(
        "/api/v1/auth/password",
        headers=user_headers,
        json={
            "current_password": test_user["password"],
            "new_password": "newpassword123"
        }
    )
    assert response.status_code == 200

    # Verify complete audit trail
    logs = db_session.query(AuditLog).filter(
        AuditLog.user_id == user_id
    ).order_by(AuditLog.created_at.asc()).all()

    # Verify sequence of events
    actions = [log.action for log in logs]
    assert "USER_CREATED" in actions
    assert "AUTH_LOGIN" in actions
    assert "USER_UPDATED" in actions
    assert "PASSWORD_CHANGED" in actions

    # Verify chronological order
    timestamps = [log.created_at for log in logs]
    assert all(timestamps[i] <= timestamps[i+1] for i in range(len(timestamps)-1))

@pytest.mark.integration
@pytest.mark.asyncio
async def test_audit_log_consistency(
    client: TestClient,
    db_session: Session,
    test_user: Dict,
    admin_headers: Dict[str, str]
):
    """Test consistency of audit logs across different access methods."""
    # Create test user and events
    test_user = dict(test_user)
    test_user["email"] = "consistency_test@example.com"
    user_in = UserCreate(**test_user)
    user = create_user(db_session, user_in)

    # Create some audit events
    events = [
        ("USER_LOGIN", "User logged in"),
        ("PROFILE_UPDATE", "User updated profile"),
        ("SECURITY_CHANGE", "Security settings changed")
    ]

    for action, details in events:
        log = AuditLog(
            action=action,
            details=details,
            user_id=user.id,
            created_at=datetime.utcnow()
        )
        db_session.add(log)
    db_session.commit()

    # Test different ways of accessing the logs
    # 1. Direct database query
    db_logs = db_session.query(AuditLog).filter(
        AuditLog.user_id == user.id
    ).all()

    # 2. API endpoint
    response = client.get(
        f"/api/v1/audit/logs?user_id={user.id}",
        headers=admin_headers
    )
    assert response.status_code == 200
    api_logs = response.json()

    # 3. Summary endpoint
    response = client.get(
        "/api/v1/audit/summary",
        headers=admin_headers
    )
    assert response.status_code == 200
    summary = response.json()

    # Verify consistency
    assert len(db_logs) == len(api_logs)
    assert all(
        any(db_log.action == api_log["action"] for api_log in api_logs)
        for db_log in db_logs
    )
    assert user.id in str(summary["most_active_users"]) 