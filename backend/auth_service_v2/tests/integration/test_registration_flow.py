"""Integration tests for the complete user registration flow."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_email_verification_token
from app.services.user import get_user_by_email

def test_complete_registration_flow(client: TestClient, db_session: Session):
    """Test the complete user registration flow including email verification."""
    # Step 1: Register a new user
    registration_data = {
        "email": "newuser@example.com",
        "password": "securepassword123",
        "name": "New Test User"
    }
    
    response = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json=registration_data
    )
    assert response.status_code == 201
    user_data = response.json()
    assert user_data["email"] == registration_data["email"]
    assert user_data["name"] == registration_data["name"]
    assert not user_data["is_active"]  # User should be inactive until email verification
    
    # Step 2: Try to login before email verification (should fail)
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": registration_data["email"],
            "password": registration_data["password"]
        }
    )
    assert response.status_code == 400
    assert "inactive" in response.json()["detail"].lower()
    
    # Step 3: Get the user and create verification token
    user = get_user_by_email(db_session, registration_data["email"])
    verification_token = create_email_verification_token(user.email)
    
    # Step 4: Verify email
    response = client.post(
        f"{settings.API_V1_STR}/auth/verify-email",
        json={"token": verification_token}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Email verified successfully"
    
    # Step 5: Verify user is now active
    user = get_user_by_email(db_session, registration_data["email"])
    assert user.is_active
    
    # Step 6: Login should now work
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": registration_data["email"],
            "password": registration_data["password"]
        }
    )
    assert response.status_code == 200
    tokens = response.json()
    assert "access_token" in tokens
    assert "token_type" in tokens
    assert tokens["token_type"] == "bearer"

def test_registration_with_invalid_verification(client: TestClient, db_session: Session):
    """Test registration flow with invalid verification attempts."""
    # Step 1: Register a new user
    registration_data = {
        "email": "another@example.com",
        "password": "securepassword123",
        "name": "Another Test User"
    }
    
    response = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json=registration_data
    )
    assert response.status_code == 201
    
    # Step 2: Try to verify with invalid token
    response = client.post(
        f"{settings.API_V1_STR}/auth/verify-email",
        json={"token": "invalid_token"}
    )
    assert response.status_code == 400
    assert "invalid" in response.json()["detail"].lower()
    
    # Step 3: Verify user is still inactive
    user = get_user_by_email(db_session, registration_data["email"])
    assert not user.is_active
    
    # Step 4: Login should still fail
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": registration_data["email"],
            "password": registration_data["password"]
        }
    )
    assert response.status_code == 400
    assert "inactive" in response.json()["detail"].lower()

def test_registration_email_verification_expiry(client: TestClient, db_session: Session):
    """Test that email verification tokens expire correctly."""
    # Step 1: Register a new user
    registration_data = {
        "email": "expiry@example.com",
        "password": "securepassword123",
        "name": "Expiry Test User"
    }
    
    response = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json=registration_data
    )
    assert response.status_code == 201
    
    # Step 2: Create an expired verification token
    from app.core.security import create_email_verification_token
    import time
    from jose import jwt
    
    # Create token that's already expired
    user = get_user_by_email(db_session, registration_data["email"])
    expired_token = jwt.encode(
        {"exp": time.time() - 3600, "sub": user.email, "type": "email_verification"},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    
    # Step 3: Try to verify with expired token
    response = client.post(
        f"{settings.API_V1_STR}/auth/verify-email",
        json={"token": expired_token}
    )
    assert response.status_code == 400
    assert "expired" in response.json()["detail"].lower()
    
    # Step 4: Verify user is still inactive
    user = get_user_by_email(db_session, registration_data["email"])
    assert not user.is_active 