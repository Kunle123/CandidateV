"""Contract tests for validating complete authentication workflow."""
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.security import get_password_hash
from app.services.user import create_user
from tests.utils.user import authentication_token_from_email

def test_complete_registration_flow(client: TestClient):
    """Test the complete user registration and email verification flow."""
    # Step 1: Register new user
    user_data = {
        "email": "newuser@example.com",
        "password": "testpassword123",
        "name": "New Test User"
    }
    
    response = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json=user_data
    )
    assert response.status_code == 201
    
    # Verify response format
    user_response = response.json()
    assert "id" in user_response
    assert "email" in user_response
    assert user_response["email"] == user_data["email"]
    assert "is_active" in user_response
    assert not user_response["is_active"]  # Should be inactive until verified
    
    # Step 2: Verify email (mocked token for test)
    token = "test-verification-token"
    response = client.post(
        f"{settings.API_V1_STR}/auth/verify-email",
        json={"token": token}
    )
    assert response.status_code == 200
    
    # Step 3: Login with verified account
    login_data = {
        "username": user_data["email"],
        "password": user_data["password"]
    }
    
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data=login_data
    )
    assert response.status_code == 200
    
    # Verify token response
    token_response = response.json()
    assert "access_token" in token_response
    assert "token_type" in token_response
    assert token_response["token_type"] == "bearer"

def test_password_reset_flow(client: TestClient, test_user):
    """Test the complete password reset flow."""
    # Step 1: Request password reset
    response = client.post(
        f"{settings.API_V1_STR}/auth/password-reset/request",
        json={"email": test_user["email"]}
    )
    assert response.status_code == 200
    
    # Step 2: Reset password with token (mocked)
    reset_token = "test-reset-token"
    new_password = "newpassword123"
    
    response = client.post(
        f"{settings.API_V1_STR}/auth/password-reset/verify",
        json={
            "token": reset_token,
            "new_password": new_password
        }
    )
    assert response.status_code == 200
    
    # Step 3: Login with new password
    login_data = {
        "username": test_user["email"],
        "password": new_password
    }
    
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data=login_data
    )
    assert response.status_code == 200

def test_token_refresh_flow(client: TestClient, test_user):
    """Test the token refresh flow."""
    # Step 1: Get initial tokens
    login_data = {
        "username": test_user["email"],
        "password": test_user["password"]
    }
    
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data=login_data
    )
    assert response.status_code == 200
    tokens = response.json()
    
    # Step 2: Use refresh token to get new access token
    refresh_response = client.post(
        f"{settings.API_V1_STR}/auth/refresh",
        headers={"Authorization": f"Bearer {tokens['refresh_token']}"}
    )
    assert refresh_response.status_code == 200
    
    # Verify new tokens
    new_tokens = refresh_response.json()
    assert "access_token" in new_tokens
    assert new_tokens["access_token"] != tokens["access_token"]

def test_token_revocation_flow(client: TestClient, test_user):
    """Test the token revocation flow."""
    # Step 1: Login to get tokens
    token = authentication_token_from_email(client, test_user["email"])
    
    # Step 2: Revoke token
    response = client.post(
        f"{settings.API_V1_STR}/auth/logout",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    
    # Step 3: Verify token is no longer valid
    response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 401

def test_concurrent_sessions(client: TestClient, test_user):
    """Test handling of concurrent login sessions."""
    # Login from multiple "devices"
    tokens = []
    for _ in range(3):
        response = client.post(
            f"{settings.API_V1_STR}/auth/login",
            data={
                "username": test_user["email"],
                "password": test_user["password"]
            }
        )
        assert response.status_code == 200
        tokens.append(response.json()["access_token"])
    
    # Verify all tokens are valid
    for token in tokens:
        response = client.get(
            f"{settings.API_V1_STR}/users/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
    
    # Logout from one session
    response = client.post(
        f"{settings.API_V1_STR}/auth/logout",
        headers={"Authorization": f"Bearer {tokens[0]}"}
    )
    assert response.status_code == 200
    
    # Other sessions should still be valid
    for token in tokens[1:]:
        response = client.get(
            f"{settings.API_V1_STR}/users/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200 