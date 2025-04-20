"""Performance tests for audit logging functionality."""
import pytest
import asyncio
import time
from datetime import datetime, timedelta
from typing import Dict, List
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

from app.services.audit import create_audit_log, log_user_event
from app.services.user import create_user
from app.models.user import UserCreate
from app.core.security import get_password_hash
from app.db.models import AuditLog

@pytest.fixture
async def test_users(db_session: Session, test_user: Dict) -> List[Dict]:
    """Create multiple test users for performance testing."""
    users = []
    for i in range(5):
        user_data = dict(test_user)
        user_data["email"] = f"perf_test_user_{i}@example.com"
        user_data["password"] = get_password_hash(user_data["password"])
        user_in = UserCreate(**user_data)
        user = create_user(db_session, user_in)
        users.append(user)
    return users

@pytest.mark.performance
@pytest.mark.asyncio
async def test_concurrent_log_creation_performance(db_session: Session, test_users: List[Dict]):
    """Test performance of concurrent audit log creation."""
    NUM_LOGS = 100  # Number of logs to create concurrently
    
    start_time = time.time()

    async def create_log(index: int, user):
        return await create_audit_log(
            db=db_session,
            action=f"PERF_TEST_{index}",
            details={
                "test_id": index,
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": str(user.id)
            },
            user=user
        )

    # Create tasks for concurrent log creation
    tasks = []
    for i in range(NUM_LOGS):
        user = test_users[i % len(test_users)]
        tasks.append(create_log(i, user))

    # Execute all tasks concurrently
    audit_logs = await asyncio.gather(*tasks)
    
    end_time = time.time()
    duration = end_time - start_time

    # Verify results and performance
    assert len(audit_logs) == NUM_LOGS
    assert all(log.id is not None for log in audit_logs)
    
    # Performance assertions
    assert duration < 5.0  # Should complete within 5 seconds
    avg_time_per_log = duration / NUM_LOGS
    assert avg_time_per_log < 0.05  # Average time per log should be under 50ms

@pytest.mark.performance
@pytest.mark.asyncio
async def test_log_retrieval_performance(
    client: TestClient,
    admin_headers: Dict[str, str],
    db_session: Session,
    test_users: List[Dict]
):
    """Test performance of audit log retrieval with large datasets."""
    # Create a large number of test logs
    NUM_LOGS = 1000
    base_time = datetime.utcnow()
    
    for i in range(NUM_LOGS):
        user = test_users[i % len(test_users)]
        log = AuditLog(
            action=f"PERF_TEST_{i}",
            details={
                "test_id": i,
                "data": "x" * 100  # Add some data to each log
            },
            user_id=user.id,
            created_at=base_time - timedelta(minutes=i)
        )
        db_session.add(log)
    
    db_session.commit()

    # Test different retrieval scenarios
    scenarios = [
        ("/api/v1/audit/logs", "basic retrieval"),
        ("/api/v1/audit/logs?action=PERF_TEST_1", "filtered by action"),
        (f"/api/v1/audit/logs?start_date={base_time - timedelta(hours=1)}", "filtered by date"),
        ("/api/v1/audit/logs?limit=100", "paginated retrieval")
    ]

    for endpoint, scenario in scenarios:
        start_time = time.time()
        response = client.get(endpoint, headers=admin_headers)
        duration = time.time() - start_time

        assert response.status_code == 200
        logs = response.json()
        
        # Performance assertions for each scenario
        assert duration < 2.0  # Should complete within 2 seconds
        if "limit=100" in endpoint:
            assert len(logs) <= 100
        if "action=" in endpoint:
            assert all(log["action"] == "PERF_TEST_1" for log in logs)

@pytest.mark.performance
@pytest.mark.asyncio
async def test_filter_performance(
    client: TestClient,
    admin_headers: Dict[str, str],
    db_session: Session,
    test_users: List[Dict]
):
    """Test performance of complex audit log filtering."""
    # Create test data with various attributes
    NUM_LOGS = 500
    actions = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT"]
    base_time = datetime.utcnow()

    for i in range(NUM_LOGS):
        user = test_users[i % len(test_users)]
        action = actions[i % len(actions)]
        log = AuditLog(
            action=f"TEST_{action}",
            details={
                "test_id": i,
                "category": f"category_{i % 5}",
                "severity": i % 3,
                "metadata": {
                    "ip": f"192.168.1.{i % 255}",
                    "browser": f"Browser {i % 3}"
                }
            },
            user_id=user.id,
            created_at=base_time - timedelta(minutes=i)
        )
        db_session.add(log)
    
    db_session.commit()

    # Test complex filter combinations
    filter_scenarios = [
        {
            "action": "TEST_CREATE",
            "user_id": str(test_users[0].id),
            "start_date": (base_time - timedelta(hours=1)).isoformat()
        },
        {
            "action": "TEST_UPDATE",
            "end_date": base_time.isoformat(),
            "limit": 50
        },
        {
            "start_date": (base_time - timedelta(minutes=30)).isoformat(),
            "end_date": base_time.isoformat(),
            "user_id": str(test_users[1].id)
        }
    ]

    for filters in filter_scenarios:
        # Construct query parameters
        query_params = "&".join(f"{k}={v}" for k, v in filters.items())
        endpoint = f"/api/v1/audit/logs?{query_params}"

        start_time = time.time()
        response = client.get(endpoint, headers=admin_headers)
        duration = time.time() - start_time

        assert response.status_code == 200
        logs = response.json()

        # Performance assertions
        assert duration < 1.0  # Complex filters should complete within 1 second
        if "limit" in filters:
            assert len(logs) <= filters["limit"]
        if "action" in filters:
            assert all(log["action"] == filters["action"] for log in logs)

@pytest.mark.performance
@pytest.mark.asyncio
async def test_summary_generation_performance(
    client: TestClient,
    admin_headers: Dict[str, str],
    db_session: Session
):
    """Test performance of audit log summary generation."""
    start_time = time.time()
    
    # Get summary statistics
    response = client.get("/api/v1/audit/summary", headers=admin_headers)
    duration = time.time() - start_time

    assert response.status_code == 200
    summary = response.json()

    # Verify summary structure and performance
    assert "total_events" in summary
    assert "action_counts" in summary
    assert "most_active_users" in summary
    assert duration < 3.0  # Summary generation should complete within 3 seconds 