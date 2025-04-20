"""Test user management API endpoints."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.user import create_user
from app.core.security import get_password_hash
from tests.utils.user import authentication_token_from_email

def test_read_current_user(client: TestClient, test_user, db_session: Session):
    """Test getting current user profile."""
    # Create and authenticate user
    test_user["password"] = get_password_hash(test_user["password"])
    create_user(db_session, test_user)
    auth_headers = {"Authorization": f"Bearer {authentication_token_from_email(test_user['email'])}"}
    
    response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=auth_headers
    )
    assert response.status_code == 200
    user_data = response.json()
    assert user_data["email"] == test_user["email"]
    assert user_data["name"] == test_user["name"]
    assert "id" in user_data

def test_update_current_user(client: TestClient, test_user, db_session: Session):
    """Test updating current user profile."""
    # Create and authenticate user
    test_user["password"] = get_password_hash(test_user["password"])
    create_user(db_session, test_user)
    auth_headers = {"Authorization": f"Bearer {authentication_token_from_email(test_user['email'])}"}
    
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
    user_data = response.json()
    assert user_data["name"] == update_data["name"]
    assert user_data["email"] == update_data["email"]

def test_delete_current_user(client: TestClient, test_user, db_session: Session):
    """Test deleting current user."""
    # Create and authenticate user
    test_user["password"] = get_password_hash(test_user["password"])
    create_user(db_session, test_user)
    auth_headers = {"Authorization": f"Bearer {authentication_token_from_email(test_user['email'])}"}
    
    response = client.delete(
        f"{settings.API_V1_STR}/users/me",
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["message"] == "User deleted successfully"
    
    # Verify user can't access profile anymore
    response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=auth_headers
    )
    assert response.status_code == 404

def test_list_users_superuser(client: TestClient, test_superuser, test_user, db_session: Session):
    """Test listing all users (superuser only)."""
    # Create superuser and regular user
    test_superuser["password"] = get_password_hash(test_superuser["password"])
    test_user["password"] = get_password_hash(test_user["password"])
    create_user(db_session, test_superuser)
    create_user(db_session, test_user)
    
    # Authenticate as superuser
    auth_headers = {"Authorization": f"Bearer {authentication_token_from_email(test_superuser['email'])}"}
    
    response = client.get(
        f"{settings.API_V1_STR}/users/",
        headers=auth_headers
    )
    assert response.status_code == 200
    users = response.json()
    assert len(users) >= 2
    assert any(user["email"] == test_superuser["email"] for user in users)
    assert any(user["email"] == test_user["email"] for user in users)

def test_list_users_regular_user(client: TestClient, test_user, db_session: Session):
    """Test that regular users cannot list all users."""
    # Create and authenticate regular user
    test_user["password"] = get_password_hash(test_user["password"])
    create_user(db_session, test_user)
    auth_headers = {"Authorization": f"Bearer {authentication_token_from_email(test_user['email'])}"}
    
    response = client.get(
        f"{settings.API_V1_STR}/users/",
        headers=auth_headers
    )
    assert response.status_code == 403

def test_search_users_superuser(client: TestClient, test_superuser, test_user, db_session: Session):
    """Test searching users (superuser only)."""
    # Create superuser and regular user
    test_superuser["password"] = get_password_hash(test_superuser["password"])
    test_user["password"] = get_password_hash(test_user["password"])
    create_user(db_session, test_superuser)
    create_user(db_session, test_user)
    
    # Authenticate as superuser
    auth_headers = {"Authorization": f"Bearer {authentication_token_from_email(test_superuser['email'])}"}
    
    # Search by email
    response = client.get(
        f"{settings.API_V1_STR}/users/search",
        headers=auth_headers,
        params={"email": test_user["email"]}
    )
    assert response.status_code == 200
    users = response.json()
    assert len(users) == 1
    assert users[0]["email"] == test_user["email"]
    
    # Search by name
    response = client.get(
        f"{settings.API_V1_STR}/users/search",
        headers=auth_headers,
        params={"name": test_user["name"]}
    )
    assert response.status_code == 200
    users = response.json()
    assert len(users) >= 1
    assert any(user["name"] == test_user["name"] for user in users) 