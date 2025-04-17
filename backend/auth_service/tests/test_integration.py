import pytest
from fastapi.testclient import TestClient
from app import services
import json
import time
from datetime import datetime, timedelta


def test_register_login_flow(client):
    """Test the complete registration and login flow."""
    # Register a new user
    register_response = client.post(
        "/api/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "securepass123",
            "name": "New Test User"
        }
    )
    assert register_response.status_code == 201
    register_data = register_response.json()
    assert register_data["email"] == "newuser@example.com"
    
    # Login with the new user
    login_response = client.post(
        "/api/auth/login",
        data={
            "username": "newuser@example.com",
            "password": "securepass123"
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert "access_token" in login_data
    assert "refresh_token" in login_data
    
    # Verify the token
    verify_response = client.get(
        "/api/auth/verify",
        headers={"Authorization": f"Bearer {login_data['access_token']}"}
    )
    assert verify_response.status_code == 200
    verify_data = verify_response.json()
    assert verify_data["email"] == "newuser@example.com"


def test_password_reset_flow(client, db_session):
    """Test the complete password reset flow."""
    # Create a test user
    user = services.create_user(db_session, "resetuser@example.com", "oldpassword123", "Reset User")
    
    # Request password reset
    forgot_response = client.post(
        "/api/auth/forgot-password",
        json={"email": "resetuser@example.com"}
    )
    assert forgot_response.status_code == 200
    
    # Get the reset token directly from the database (in a real scenario this would be sent via email)
    reset_token = db_session.query(services.ResetToken).filter(
        services.ResetToken.user_id == user.id,
        services.ResetToken.used == False
    ).first()
    assert reset_token is not None
    
    # Reset the password
    reset_response = client.post(
        "/api/auth/reset-password",
        json={
            "token": reset_token.token,
            "new_password": "newpassword456"
        }
    )
    assert reset_response.status_code == 200
    
    # Try logging in with the old password (should fail)
    old_login_response = client.post(
        "/api/auth/login",
        data={
            "username": "resetuser@example.com",
            "password": "oldpassword123"
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert old_login_response.status_code == 401
    
    # Login with the new password
    new_login_response = client.post(
        "/api/auth/login",
        data={
            "username": "resetuser@example.com",
            "password": "newpassword456"
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert new_login_response.status_code == 200


def test_token_refresh_flow(client, test_user):
    """Test the token refresh flow."""
    # Login to get initial tokens
    login_response = client.post(
        "/api/auth/login",
        data={
            "username": "test@example.com",
            "password": "testpassword"
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert login_response.status_code == 200
    login_data = login_response.json()
    
    # Use the refresh token to get a new access token
    refresh_response = client.post(
        "/api/auth/refresh",
        json={"refresh_token": login_data["refresh_token"]}
    )
    assert refresh_response.status_code == 200
    refresh_data = refresh_response.json()
    
    # The new tokens should be different from the old ones
    assert refresh_data["access_token"] != login_data["access_token"]
    assert refresh_data["refresh_token"] != login_data["refresh_token"]
    
    # Verify the new access token works
    verify_response = client.get(
        "/api/auth/verify",
        headers={"Authorization": f"Bearer {refresh_data['access_token']}"}
    )
    assert verify_response.status_code == 200
    
    # The old refresh token should no longer work
    old_refresh_response = client.post(
        "/api/auth/refresh",
        json={"refresh_token": login_data["refresh_token"]}
    )
    assert old_refresh_response.status_code == 401


def test_logout_flow(client, test_user):
    """Test the logout flow."""
    # Login to get tokens
    login_response = client.post(
        "/api/auth/login",
        data={
            "username": "test@example.com",
            "password": "testpassword"
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert login_response.status_code == 200
    login_data = login_response.json()
    
    # Logout
    logout_response = client.post(
        "/api/auth/logout",
        json={"refresh_token": login_data["refresh_token"]}
    )
    assert logout_response.status_code == 200
    
    # Try to use the refresh token after logout (should fail)
    refresh_response = client.post(
        "/api/auth/refresh",
        json={"refresh_token": login_data["refresh_token"]}
    )
    assert refresh_response.status_code == 401 