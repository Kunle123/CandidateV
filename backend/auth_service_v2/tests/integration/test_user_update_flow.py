"""Integration tests for user profile updates with authentication."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash
from app.services.user import create_user, get_user_by_email
from tests.utils.user import authentication_token_from_email

def test_complete_profile_update_flow(client: TestClient, test_user, db_session: Session):
    """Test the complete user profile update flow with authentication."""
    # Step 1: Create and authenticate user
    test_user["password"] = get_password_hash(test_user["password"])
    user = create_user(db_session, test_user)
    auth_headers = {"Authorization": f"Bearer {authentication_token_from_email(user.email)}"}
    
    # Step 2: Get current profile
    response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=auth_headers
    )
    assert response.status_code == 200
    original_profile = response.json()
    
    # Step 3: Update profile
    update_data = {
        "name": "Updated Name",
        "email": "updated@example.com"
    }
    response = client.put(
        f"{settings.API_V1_STR}/users/me",
        headers=auth_headers,
        json=update_data
    )
    assert response.status_code == 200
    updated_profile = response.json()
    assert updated_profile["name"] == update_data["name"]
    assert updated_profile["email"] == update_data["email"]
    
    # Step 4: Verify changes in database
    updated_user = get_user_by_email(db_session, update_data["email"])
    assert updated_user is not None
    assert updated_user.name == update_data["name"]
    
    # Step 5: Old email should no longer exist
    old_user = get_user_by_email(db_session, original_profile["email"])
    assert old_user is None
    
    # Step 6: Login with new email should work
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": update_data["email"],
            "password": test_user["password"]
        }
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_profile_update_with_expired_token(client: TestClient, test_user, db_session: Session):
    """Test profile update with expired token."""
    # Step 1: Create user
    test_user["password"] = get_password_hash(test_user["password"])
    user = create_user(db_session, test_user)
    
    # Step 2: Create expired token
    import time
    from jose import jwt
    
    expired_token = jwt.encode(
        {"exp": time.time() - 3600, "sub": user.email},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    auth_headers = {"Authorization": f"Bearer {expired_token}"}
    
    # Step 3: Try to update profile with expired token
    update_data = {
        "name": "Updated Name",
        "email": "updated@example.com"
    }
    response = client.put(
        f"{settings.API_V1_STR}/users/me",
        headers=auth_headers,
        json=update_data
    )
    assert response.status_code == 401
    assert "expired" in response.json()["detail"].lower()
    
    # Step 4: Verify no changes were made
    unchanged_user = get_user_by_email(db_session, test_user["email"])
    assert unchanged_user is not None
    assert unchanged_user.name == test_user["name"]
    assert unchanged_user.email == test_user["email"]

def test_profile_update_with_invalid_token(client: TestClient, test_user, db_session: Session):
    """Test profile update with invalid token."""
    # Step 1: Create user
    test_user["password"] = get_password_hash(test_user["password"])
    user = create_user(db_session, test_user)
    
    # Step 2: Try to update profile with invalid token
    auth_headers = {"Authorization": "Bearer invalid_token"}
    update_data = {
        "name": "Updated Name",
        "email": "updated@example.com"
    }
    response = client.put(
        f"{settings.API_V1_STR}/users/me",
        headers=auth_headers,
        json=update_data
    )
    assert response.status_code == 401
    assert "invalid" in response.json()["detail"].lower()
    
    # Step 3: Verify no changes were made
    unchanged_user = get_user_by_email(db_session, test_user["email"])
    assert unchanged_user is not None
    assert unchanged_user.name == test_user["name"]
    assert unchanged_user.email == test_user["email"]

def test_profile_update_email_conflict(client: TestClient, test_user, db_session: Session):
    """Test profile update with conflicting email."""
    # Step 1: Create two users
    test_user["password"] = get_password_hash(test_user["password"])
    user1 = create_user(db_session, test_user)
    
    user2_data = {
        "email": "user2@example.com",
        "password": get_password_hash("password123"),
        "name": "User 2",
        "is_active": True
    }
    user2 = create_user(db_session, user2_data)
    
    # Step 2: Try to update user1's email to user2's email
    auth_headers = {"Authorization": f"Bearer {authentication_token_from_email(user1.email)}"}
    update_data = {
        "name": "Updated Name",
        "email": user2.email
    }
    response = client.put(
        f"{settings.API_V1_STR}/users/me",
        headers=auth_headers,
        json=update_data
    )
    assert response.status_code == 400
    assert "email already registered" in response.json()["detail"].lower()
    
    # Step 3: Verify no changes were made
    unchanged_user = get_user_by_email(db_session, test_user["email"])
    assert unchanged_user is not None
    assert unchanged_user.name == test_user["name"]
    assert unchanged_user.email == test_user["email"] 