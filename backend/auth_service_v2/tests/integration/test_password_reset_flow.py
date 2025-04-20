"""Integration tests for the complete password reset flow."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_password_reset_token, get_password_hash
from app.services.user import create_user, get_user_by_email

def test_complete_password_reset_flow(client: TestClient, test_user, db_session: Session):
    """Test the complete password reset flow."""
    # Step 1: Create an active user
    test_user["password"] = get_password_hash(test_user["password"])
    user = create_user(db_session, test_user)
    original_password_hash = user.hashed_password
    
    # Step 2: Request password reset
    response = client.post(
        f"{settings.API_V1_STR}/auth/password-reset/request",
        json={"email": test_user["email"]}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Password reset email sent"
    
    # Step 3: Generate reset token (simulating email link click)
    reset_token = create_password_reset_token(user.email)
    
    # Step 4: Reset password
    new_password = "newpassword123"
    response = client.post(
        f"{settings.API_V1_STR}/auth/password-reset/verify",
        json={
            "token": reset_token,
            "new_password": new_password
        }
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Password updated successfully"
    
    # Step 5: Verify old password no longer works
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": test_user["email"],
            "password": test_user["password"]
        }
    )
    assert response.status_code == 401
    
    # Step 6: Verify new password works
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": test_user["email"],
            "password": new_password
        }
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    
    # Step 7: Verify password hash was actually updated
    updated_user = get_user_by_email(db_session, test_user["email"])
    assert updated_user.hashed_password != original_password_hash

def test_password_reset_invalid_token(client: TestClient, test_user, db_session: Session):
    """Test password reset with invalid token."""
    # Step 1: Create an active user
    test_user["password"] = get_password_hash(test_user["password"])
    user = create_user(db_session, test_user)
    original_password_hash = user.hashed_password
    
    # Step 2: Try to reset password with invalid token
    response = client.post(
        f"{settings.API_V1_STR}/auth/password-reset/verify",
        json={
            "token": "invalid_token",
            "new_password": "newpassword123"
        }
    )
    assert response.status_code == 400
    assert "invalid" in response.json()["detail"].lower()
    
    # Step 3: Verify password was not changed
    updated_user = get_user_by_email(db_session, test_user["email"])
    assert updated_user.hashed_password == original_password_hash
    
    # Step 4: Verify original password still works
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": test_user["email"],
            "password": test_user["password"]
        }
    )
    assert response.status_code == 200

def test_password_reset_expired_token(client: TestClient, test_user, db_session: Session):
    """Test password reset with expired token."""
    # Step 1: Create an active user
    test_user["password"] = get_password_hash(test_user["password"])
    user = create_user(db_session, test_user)
    
    # Step 2: Create an expired reset token
    import time
    from jose import jwt
    
    expired_token = jwt.encode(
        {"exp": time.time() - 3600, "sub": user.email, "type": "password_reset"},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    
    # Step 3: Try to reset password with expired token
    response = client.post(
        f"{settings.API_V1_STR}/auth/password-reset/verify",
        json={
            "token": expired_token,
            "new_password": "newpassword123"
        }
    )
    assert response.status_code == 400
    assert "expired" in response.json()["detail"].lower()
    
    # Step 4: Verify original password still works
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": test_user["email"],
            "password": test_user["password"]
        }
    )
    assert response.status_code == 200

def test_password_reset_nonexistent_user(client: TestClient):
    """Test password reset request for non-existent user."""
    response = client.post(
        f"{settings.API_V1_STR}/auth/password-reset/request",
        json={"email": "nonexistent@example.com"}
    )
    # Should still return 200 to prevent user enumeration
    assert response.status_code == 200
    assert response.json()["message"] == "Password reset email sent" 