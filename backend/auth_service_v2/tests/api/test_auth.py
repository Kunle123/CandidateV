"""Test authentication API endpoints."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.user import create_user
from app.core.security import get_password_hash

def test_login_success(client: TestClient, test_user, db_session: Session):
    """Test successful login."""
    # Create user first
    test_user["password"] = get_password_hash(test_user["password"])
    create_user(db_session, test_user)
    
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": test_user["email"],
            "password": "testpassword123"
        }
    )
    tokens = response.json()
    assert response.status_code == 200
    assert "access_token" in tokens
    assert "token_type" in tokens
    assert tokens["token_type"] == "bearer"

def test_login_invalid_password(client: TestClient, test_user, db_session: Session):
    """Test login with invalid password."""
    # Create user first
    test_user["password"] = get_password_hash(test_user["password"])
    create_user(db_session, test_user)
    
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": test_user["email"],
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"

def test_register_success(client: TestClient):
    """Test successful user registration."""
    response = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "newpassword123",
            "name": "New User"
        }
    )
    assert response.status_code == 201
    created_user = response.json()
    assert created_user["email"] == "newuser@example.com"
    assert created_user["name"] == "New User"
    assert "id" in created_user
    assert "is_active" in created_user
    assert not created_user["is_superuser"]

def test_register_existing_email(client: TestClient, test_user, db_session: Session):
    """Test registration with existing email."""
    # Create user first
    test_user["password"] = get_password_hash(test_user["password"])
    create_user(db_session, test_user)
    
    response = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": test_user["email"],
            "password": "anotherpassword123",
            "name": "Another User"
        }
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

def test_request_password_reset(client: TestClient, test_user, db_session: Session):
    """Test password reset request."""
    # Create user first
    test_user["password"] = get_password_hash(test_user["password"])
    create_user(db_session, test_user)
    
    response = client.post(
        f"{settings.API_V1_STR}/auth/password-reset/request",
        json={"email": test_user["email"]}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Password reset email sent"

def test_reset_password(client: TestClient, test_user, db_session: Session):
    """Test password reset with token."""
    # Create user first
    test_user["password"] = get_password_hash(test_user["password"])
    user = create_user(db_session, test_user)
    
    # Generate reset token (this would normally be sent via email)
    from app.core.security import create_password_reset_token
    token = create_password_reset_token(user.email)
    
    response = client.post(
        f"{settings.API_V1_STR}/auth/password-reset/verify",
        json={
            "token": token,
            "new_password": "newpassword123"
        }
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Password updated successfully"

def test_verify_email(client: TestClient, test_user, db_session: Session):
    """Test email verification."""
    # Create unverified user
    test_user["password"] = get_password_hash(test_user["password"])
    test_user["is_active"] = False
    user = create_user(db_session, test_user)
    
    # Generate verification token
    from app.core.security import create_email_verification_token
    token = create_email_verification_token(user.email)
    
    response = client.post(
        f"{settings.API_V1_STR}/auth/verify-email",
        json={"token": token}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Email verified successfully" 