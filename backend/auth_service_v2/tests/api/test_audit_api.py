"""Integration tests for audit logging through API endpoints."""
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from typing import Dict

from app.core.security import create_access_token
from app.services.user import create_user
from app.models.user import UserCreate
from app.core.security import get_password_hash
from app.db.models import AuditLog

@pytest.fixture
def admin_headers(test_superuser: Dict, db_session: Session) -> Dict[str, str]:
    """Create admin user and return headers with admin token."""
    # Create admin user
    admin_data = dict(test_superuser)
    admin_data["email"] = "audit_admin@example.com"
    admin_data["password"] = get_password_hash(admin_data["password"])
    user_in = UserCreate(**admin_data)
    admin = create_user(db_session, user_in)
    
    # Create access token
    access_token = create_access_token(subject=admin.email)
    return {"Authorization": f"Bearer {access_token}"}

@pytest.mark.asyncio
async def test_get_audit_logs(client: TestClient, admin_headers: Dict[str, str], db_session: Session):
    """Test retrieving audit logs through API endpoint."""
    # Create some test audit logs
    response = client.post(
        "/api/v1/users",
        headers=admin_headers,
        json={
            "email": "test_audit_user@example.com",
            "password": "testpassword123",
            "name": "Test User"
        }
    )
    assert response.status_code == 201

    # Get audit logs
    response = client.get("/api/v1/audit/logs", headers=admin_headers)
    assert response.status_code == 200
    
    logs = response.json()
    assert isinstance(logs, list)
    assert len(logs) > 0
    
    # Verify log structure
    log = logs[0]
    assert "id" in log
    assert "action" in log
    assert "details" in log
    assert "created_at" in log

@pytest.mark.asyncio
async def test_get_audit_logs_with_filters(
    client: TestClient,
    admin_headers: Dict[str, str],
    db_session: Session
):
    """Test retrieving audit logs with various filters."""
    # Create test data through API actions
    for _ in range(3):
        response = client.post(
            "/api/v1/users",
            headers=admin_headers,
            json={
                "email": f"filter_test_{_}@example.com",
                "password": "testpassword123",
                "name": f"Filter Test User {_}"
            }
        )
        assert response.status_code == 201

    # Test filtering by action
    response = client.get(
        "/api/v1/audit/logs?action=USER_CREATED",
        headers=admin_headers
    )
    assert response.status_code == 200
    logs = response.json()
    assert all(log["action"] == "USER_CREATED" for log in logs)

    # Test filtering by time range
    yesterday = datetime.utcnow() - timedelta(days=1)
    response = client.get(
        f"/api/v1/audit/logs?start_date={yesterday.isoformat()}",
        headers=admin_headers
    )
    assert response.status_code == 200
    logs = response.json()
    assert len(logs) > 0

@pytest.mark.asyncio
async def test_get_audit_log_summary(
    client: TestClient,
    admin_headers: Dict[str, str],
    db_session: Session
):
    """Test retrieving audit log summary statistics."""
    # Create some test data
    for _ in range(3):
        response = client.post(
            "/api/v1/users",
            headers=admin_headers,
            json={
                "email": f"summary_test_{_}@example.com",
                "password": "testpassword123",
                "name": f"Summary Test User {_}"
            }
        )
        assert response.status_code == 201

    # Get summary statistics
    response = client.get("/api/v1/audit/summary", headers=admin_headers)
    assert response.status_code == 200
    
    summary = response.json()
    assert "total_events" in summary
    assert "action_counts" in summary
    assert "most_active_users" in summary
    assert summary["total_events"] > 0

@pytest.mark.asyncio
async def test_audit_log_retention(
    client: TestClient,
    admin_headers: Dict[str, str],
    db_session: Session
):
    """Test audit log retention policy."""
    # Create old audit log directly in database
    old_date = datetime.utcnow() - timedelta(days=90)
    old_log = AuditLog(
        action="OLD_TEST_ACTION",
        details="Old test log",
        created_at=old_date
    )
    db_session.add(old_log)
    db_session.commit()

    # Trigger retention cleanup
    response = client.post(
        "/api/v1/audit/cleanup",
        headers=admin_headers,
        json={"retention_days": 30}
    )
    assert response.status_code == 200

    # Verify old log was removed
    response = client.get(
        f"/api/v1/audit/logs?action=OLD_TEST_ACTION",
        headers=admin_headers
    )
    assert response.status_code == 200
    logs = response.json()
    assert len(logs) == 0

@pytest.mark.asyncio
async def test_unauthorized_access(client: TestClient):
    """Test unauthorized access to audit endpoints."""
    # Try accessing without authentication
    response = client.get("/api/v1/audit/logs")
    assert response.status_code == 401

    # Try accessing with invalid token
    headers = {"Authorization": "Bearer invalid_token"}
    response = client.get("/api/v1/audit/logs", headers=headers)
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_forbidden_access(client: TestClient, test_user: Dict, db_session: Session):
    """Test forbidden access to audit endpoints with non-admin user."""
    # Create regular user
    user_data = dict(test_user)
    user_data["email"] = "regular_user@example.com"
    user_data["password"] = get_password_hash(user_data["password"])
    user_in = UserCreate(**user_data)
    user = create_user(db_session, user_in)
    
    # Create access token for regular user
    access_token = create_access_token(subject=user.email)
    headers = {"Authorization": f"Bearer {access_token}"}

    # Try accessing audit logs
    response = client.get("/api/v1/audit/logs", headers=headers)
    assert response.status_code == 403 