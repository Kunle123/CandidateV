"""Test rate limiting on critical endpoints."""
import pytest
import time
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings

def test_login_rate_limit(client: TestClient, test_user, db_session: Session):
    """Test rate limiting on login endpoint."""
    # Create user first
    from app.services.user import create_user
    from app.core.security import get_password_hash
    test_user["password"] = get_password_hash(test_user["password"])
    create_user(db_session, test_user)
    
    # Try to login multiple times quickly
    for i in range(settings.RATE_LIMIT_PER_MINUTE + 1):
        response = client.post(
            f"{settings.API_V1_STR}/auth/login",
            data={
                "username": test_user["email"],
                "password": "testpassword123"
            }
        )
        if i < settings.RATE_LIMIT_PER_MINUTE:
            assert response.status_code == 200
        else:
            assert response.status_code == 429
            assert "Rate limit exceeded" in response.json()["detail"]

def test_register_rate_limit(client: TestClient):
    """Test rate limiting on registration endpoint."""
    # Try to register multiple times quickly
    for i in range(settings.RATE_LIMIT_PER_MINUTE + 1):
        response = client.post(
            f"{settings.API_V1_STR}/auth/register",
            json={
                "email": f"test{i}@example.com",
                "password": "testpassword123",
                "name": f"Test User {i}"
            }
        )
        if i < settings.RATE_LIMIT_PER_MINUTE:
            assert response.status_code == 201
        else:
            assert response.status_code == 429
            assert "Rate limit exceeded" in response.json()["detail"]

def test_password_reset_rate_limit(client: TestClient, test_user, db_session: Session):
    """Test rate limiting on password reset request endpoint."""
    # Create user first
    from app.services.user import create_user
    from app.core.security import get_password_hash
    test_user["password"] = get_password_hash(test_user["password"])
    create_user(db_session, test_user)
    
    # Try to request password reset multiple times quickly
    for i in range(settings.RATE_LIMIT_PER_MINUTE + 1):
        response = client.post(
            f"{settings.API_V1_STR}/auth/password-reset/request",
            json={"email": test_user["email"]}
        )
        if i < settings.RATE_LIMIT_PER_MINUTE:
            assert response.status_code == 200
        else:
            assert response.status_code == 429
            assert "Rate limit exceeded" in response.json()["detail"]

def test_rate_limit_reset(client: TestClient, test_user, db_session: Session):
    """Test that rate limits reset after the specified time window."""
    # Create user first
    from app.services.user import create_user
    from app.core.security import get_password_hash
    test_user["password"] = get_password_hash(test_user["password"])
    create_user(db_session, test_user)
    
    # Make maximum allowed requests
    for _ in range(settings.RATE_LIMIT_PER_MINUTE):
        response = client.post(
            f"{settings.API_V1_STR}/auth/login",
            data={
                "username": test_user["email"],
                "password": "testpassword123"
            }
        )
        assert response.status_code == 200
    
    # Next request should be rate limited
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": test_user["email"],
            "password": "testpassword123"
        }
    )
    assert response.status_code == 429
    
    # Wait for rate limit window to reset (61 seconds to be safe)
    time.sleep(61)
    
    # Should be able to make requests again
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": test_user["email"],
            "password": "testpassword123"
        }
    )
    assert response.status_code == 200 