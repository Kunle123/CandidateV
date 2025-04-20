"""Contract tests for validating rate limiting implementation."""
import time
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings

def test_login_rate_limit(client: TestClient):
    """Test that login endpoint enforces rate limiting."""
    login_data = {
        "username": "test@example.com",
        "password": "testpassword123"
    }
    
    # Make multiple requests quickly
    responses = []
    for _ in range(10):
        response = client.post(
            f"{settings.API_V1_STR}/auth/login",
            data=login_data
        )
        responses.append(response)
    
    # Verify that rate limiting kicked in
    assert any(r.status_code == 429 for r in responses), "Rate limiting not enforced"
    
    # Check rate limit response format
    rate_limited_response = next(r for r in responses if r.status_code == 429)
    assert "Retry-After" in rate_limited_response.headers
    assert isinstance(int(rate_limited_response.headers["Retry-After"]), int)
    
    error_body = rate_limited_response.json()
    assert "detail" in error_body
    assert "rate limit" in error_body["detail"].lower()

def test_register_rate_limit(client: TestClient):
    """Test that register endpoint enforces rate limiting."""
    register_data = {
        "email": "test@example.com",
        "password": "testpassword123",
        "name": "Test User"
    }
    
    # Make multiple requests quickly
    responses = []
    for i in range(5):
        register_data["email"] = f"test{i}@example.com"
        response = client.post(
            f"{settings.API_V1_STR}/auth/register",
            json=register_data
        )
        responses.append(response)
    
    # Verify rate limiting
    assert any(r.status_code == 429 for r in responses), "Rate limiting not enforced"

def test_password_reset_rate_limit(client: TestClient):
    """Test that password reset endpoint enforces rate limiting."""
    reset_data = {
        "email": "test@example.com"
    }
    
    # Make multiple requests quickly
    responses = []
    for _ in range(5):
        response = client.post(
            f"{settings.API_V1_STR}/auth/password-reset/request",
            json=reset_data
        )
        responses.append(response)
    
    # Verify rate limiting
    assert any(r.status_code == 429 for r in responses), "Rate limiting not enforced"

def test_rate_limit_by_ip(client: TestClient):
    """Test that rate limiting is properly scoped by IP address."""
    login_data = {
        "username": "test@example.com",
        "password": "testpassword123"
    }
    
    # Test with different IP addresses
    ips = ["1.2.3.4", "5.6.7.8"]
    
    for ip in ips:
        # Make requests with specific IP
        responses = []
        headers = {"X-Forwarded-For": ip}
        
        for _ in range(5):
            response = client.post(
                f"{settings.API_V1_STR}/auth/login",
                data=login_data,
                headers=headers
            )
            responses.append(response)
        
        # Each IP should have its own rate limit
        success_count = sum(1 for r in responses if r.status_code != 429)
        assert success_count > 0, f"All requests blocked for IP {ip}"

def test_rate_limit_reset(client: TestClient):
    """Test that rate limits reset after the specified window."""
    login_data = {
        "username": "test@example.com",
        "password": "testpassword123"
    }
    
    # Make requests until rate limited
    response = None
    for _ in range(10):
        response = client.post(
            f"{settings.API_V1_STR}/auth/login",
            data=login_data
        )
        if response.status_code == 429:
            break
    
    assert response.status_code == 429, "Rate limit not reached"
    
    # Wait for rate limit window
    retry_after = int(response.headers["Retry-After"])
    time.sleep(retry_after)
    
    # Verify we can make requests again
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data=login_data
    )
    assert response.status_code != 429, "Rate limit not reset after window"

def test_rate_limit_headers(client: TestClient):
    """Test that rate limit headers are properly included in responses."""
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": "test@example.com",
            "password": "testpassword123"
        }
    )
    
    # Check for standard rate limit headers
    assert "X-RateLimit-Limit" in response.headers
    assert "X-RateLimit-Remaining" in response.headers
    assert "X-RateLimit-Reset" in response.headers
    
    # Validate header values
    assert isinstance(int(response.headers["X-RateLimit-Limit"]), int)
    assert isinstance(int(response.headers["X-RateLimit-Remaining"]), int)
    assert isinstance(int(response.headers["X-RateLimit-Reset"]), int) 