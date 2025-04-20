"""Test API dependencies."""
import pytest
from fastapi import HTTPException
from jose import jwt

from app.api import deps
from app.core.config import settings
from app.core.security import create_access_token
from app.models.token import TokenData
from app.db.models import User
from app.services.user import create_user

def test_token_data():
    """Test TokenData model."""
    # Test with subject
    token_data = TokenData(sub="test@example.com")
    assert token_data.sub == "test@example.com"
    
    # Test without subject
    token_data = TokenData()
    assert token_data.sub is None

def test_get_current_user(db_session, test_user):
    """Test getting current user from valid token."""
    # Create user in DB
    db_user = create_user(db_session, test_user)
    
    # Create access token
    access_token = create_access_token(test_user["email"])
    
    # Get current user
    current_user = deps.get_current_user(db_session, access_token)
    assert current_user.email == test_user["email"]

def test_get_current_user_invalid_token(db_session):
    """Test getting current user with invalid token."""
    with pytest.raises(HTTPException) as exc:
        deps.get_current_user(db_session, "invalid_token")
    assert exc.value.status_code == 401
    assert exc.value.detail == "Could not validate credentials"

def test_get_current_user_nonexistent(db_session, test_user):
    """Test getting current user with non-existent email."""
    # Create access token without creating user
    access_token = create_access_token(test_user["email"])
    
    with pytest.raises(HTTPException) as exc:
        deps.get_current_user(db_session, access_token)
    assert exc.value.status_code == 404
    assert exc.value.detail == "User not found"

def test_get_current_active_user(db_session, test_user):
    """Test getting active user."""
    # Create active user
    db_user = create_user(db_session, test_user)
    db_user.is_active = True
    db_session.commit()
    
    current_user = deps.get_current_active_user(db_user)
    assert current_user.email == test_user["email"]

def test_get_current_active_user_inactive(db_session, test_user):
    """Test getting inactive user."""
    # Create inactive user
    db_user = create_user(db_session, test_user)
    db_user.is_active = False
    db_session.commit()
    
    with pytest.raises(HTTPException) as exc:
        deps.get_current_active_user(db_user)
    assert exc.value.status_code == 400
    assert exc.value.detail == "Inactive user"

def test_get_current_active_superuser(db_session, test_superuser):
    """Test getting active superuser."""
    # Create superuser
    db_user = create_user(db_session, test_superuser)
    
    current_user = deps.get_current_active_superuser(db_user)
    assert current_user.email == test_superuser["email"]
    assert current_user.is_superuser

def test_get_current_active_superuser_not_super(db_session, test_user):
    """Test getting non-superuser as superuser."""
    # Create regular user
    db_user = create_user(db_session, test_user)
    
    with pytest.raises(HTTPException) as exc:
        deps.get_current_active_superuser(db_user)
    assert exc.value.status_code == 400
    assert exc.value.detail == "The user doesn't have enough privileges" 