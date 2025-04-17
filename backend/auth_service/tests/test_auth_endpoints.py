import pytest
import json
from app import services


def test_health_check(client):
    """Test the health check endpoint."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data
    assert data["version"] == "1.0.0"
    assert data["database_connection"] == "ok"


def test_register_success(client):
    """Test successful user registration."""
    response = client.post(
        "/api/auth/register",
        json={
            "email": "new@example.com",
            "password": "password123",
            "name": "New User"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "new@example.com"
    assert data["name"] == "New User"
    assert "id" in data
    assert "created_at" in data


def test_register_duplicate_email(client, test_user):
    """Test registration with an existing email."""
    response = client.post(
        "/api/auth/register",
        json={
            "email": "test@example.com",  # Same as test_user
            "password": "password123",
            "name": "Another User"
        }
    )
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "already registered" in data["detail"]


def test_login_success(client, test_user):
    """Test successful login."""
    response = client.post(
        "/api/auth/login",
        data={
            "username": "test@example.com",
            "password": "testpassword"
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] > 0


def test_login_wrong_password(client, test_user):
    """Test login with wrong password."""
    response = client.post(
        "/api/auth/login",
        data={
            "username": "test@example.com",
            "password": "wrongpassword"
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data


def test_refresh_token(client, test_refresh_token):
    """Test token refresh."""
    response = client.post(
        "/api/auth/refresh",
        json={"refresh_token": test_refresh_token.token}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] > 0


def test_refresh_token_invalid(client):
    """Test token refresh with invalid token."""
    response = client.post(
        "/api/auth/refresh",
        json={"refresh_token": "invalid_token"}
    )
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data


def test_verify_token(client, auth_headers):
    """Test token verification."""
    response = client.get(
        "/api/auth/verify",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "user_id" in data
    assert "email" in data
    assert "expires_at" in data


def test_verify_token_invalid(client):
    """Test token verification with invalid token."""
    response = client.get(
        "/api/auth/verify",
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data


def test_logout(client, test_refresh_token):
    """Test logout endpoint."""
    response = client.post(
        "/api/auth/logout",
        json={"refresh_token": test_refresh_token.token}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Successfully logged out"


def test_forgot_password_registered_email(client, test_user):
    """Test forgot password with a registered email."""
    response = client.post(
        "/api/auth/forgot-password",
        json={"email": "test@example.com"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "will receive a password reset link" in data["message"]


def test_forgot_password_unregistered_email(client):
    """Test forgot password with an unregistered email."""
    response = client.post(
        "/api/auth/forgot-password",
        json={"email": "nonexistent@example.com"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "will receive a password reset link" in data["message"]


def test_reset_password_success(client, test_reset_token, db_session):
    """Test password reset with a valid token."""
    response = client.post(
        "/api/auth/reset-password",
        json={
            "token": test_reset_token.token,
            "new_password": "newpassword123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Password has been reset successfully"
    
    # Verify the user can login with the new password
    response = client.post(
        "/api/auth/login",
        data={
            "username": "test@example.com",
            "password": "newpassword123"
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 200


def test_reset_password_invalid_token(client):
    """Test password reset with an invalid token."""
    response = client.post(
        "/api/auth/reset-password",
        json={
            "token": "invalid_token",
            "new_password": "newpassword123"
        }
    )
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "Invalid or expired token" in data["detail"] 