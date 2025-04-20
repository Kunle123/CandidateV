"""Tests for role-based access control and permissions."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.user import create_user
from app.core.security import get_password_hash
from tests.utils.user import authentication_token_from_email

def test_superuser_access(client: TestClient, test_superuser, db: Session):
    """Test that superuser has access to admin endpoints."""
    # Create and activate superuser
    test_superuser["password"] = get_password_hash(test_superuser["password"])
    create_user(db, test_superuser)
    
    # Get superuser token
    token = authentication_token_from_email(client, test_superuser["email"])
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test access to admin endpoints
    response = client.get(
        f"{settings.API_V1_STR}/admin/users",
        headers=headers
    )
    assert response.status_code == 200
    
    # Test user management capabilities
    new_user_data = {
        "email": "newuser@example.com",
        "password": "testpass123",
        "name": "New User",
        "is_active": True
    }
    response = client.post(
        f"{settings.API_V1_STR}/admin/users",
        headers=headers,
        json=new_user_data
    )
    assert response.status_code == 201

def test_regular_user_restrictions(client: TestClient, test_user, db: Session):
    """Test that regular users cannot access admin endpoints."""
    # Create and activate regular user
    test_user["password"] = get_password_hash(test_user["password"])
    create_user(db, test_user)
    
    # Get user token
    token = authentication_token_from_email(client, test_user["email"])
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test access to admin endpoints (should be denied)
    response = client.get(
        f"{settings.API_V1_STR}/admin/users",
        headers=headers
    )
    assert response.status_code == 403
    
    # Test user management attempts (should be denied)
    new_user_data = {
        "email": "newuser@example.com",
        "password": "testpass123",
        "name": "New User",
        "is_active": True
    }
    response = client.post(
        f"{settings.API_V1_STR}/admin/users",
        headers=headers,
        json=new_user_data
    )
    assert response.status_code == 403

def test_inactive_user_restrictions(client: TestClient, test_user, db: Session):
    """Test that inactive users cannot access protected endpoints."""
    # Create inactive user
    test_user["is_active"] = False
    test_user["password"] = get_password_hash(test_user["password"])
    create_user(db, test_user)
    
    # Attempt to get token (should fail)
    login_data = {
        "username": test_user["email"],
        "password": test_user["password"]
    }
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data=login_data
    )
    assert response.status_code == 400
    assert "inactive" in response.json()["detail"].lower()

def test_self_management_permissions(client: TestClient, test_user, db: Session):
    """Test that users can manage their own account but not others."""
    # Create users
    test_user["password"] = get_password_hash(test_user["password"])
    user = create_user(db, test_user)
    
    other_user = create_user(db, {
        "email": "other@example.com",
        "password": get_password_hash("testpass123"),
        "name": "Other User",
        "is_active": True
    })
    
    # Get user token
    token = authentication_token_from_email(client, test_user["email"])
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test self profile access
    response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["email"] == test_user["email"]
    
    # Test self profile update
    update_data = {"name": "Updated Name"}
    response = client.put(
        f"{settings.API_V1_STR}/users/me",
        headers=headers,
        json=update_data
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Name"
    
    # Test accessing other user's profile (should be denied)
    response = client.get(
        f"{settings.API_V1_STR}/users/{other_user.id}",
        headers=headers
    )
    assert response.status_code == 403

def test_permission_inheritance(client: TestClient, test_superuser, db: Session):
    """Test that superusers inherit all lower-level permissions."""
    # Create and activate superuser
    test_superuser["password"] = get_password_hash(test_superuser["password"])
    create_user(db, test_superuser)
    
    # Get superuser token
    token = authentication_token_from_email(client, test_superuser["email"])
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test regular user endpoints
    response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=headers
    )
    assert response.status_code == 200
    
    # Test self-management endpoints
    update_data = {"name": "Updated Admin"}
    response = client.put(
        f"{settings.API_V1_STR}/users/me",
        headers=headers,
        json=update_data
    )
    assert response.status_code == 200

def test_token_permissions(client: TestClient, test_user, test_superuser, db: Session):
    """Test that token permissions match user role."""
    # Create both types of users
    test_user["password"] = get_password_hash(test_user["password"])
    regular_user = create_user(db, test_user)
    
    test_superuser["password"] = get_password_hash(test_superuser["password"])
    admin_user = create_user(db, test_superuser)
    
    # Get tokens for both users
    regular_token = authentication_token_from_email(client, test_user["email"])
    admin_token = authentication_token_from_email(client, test_superuser["email"])
    
    # Test endpoint requiring admin permissions
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    regular_headers = {"Authorization": f"Bearer {regular_token}"}
    
    response = client.get(
        f"{settings.API_V1_STR}/admin/users",
        headers=admin_headers
    )
    assert response.status_code == 200
    
    response = client.get(
        f"{settings.API_V1_STR}/admin/users",
        headers=regular_headers
    )
    assert response.status_code == 403 