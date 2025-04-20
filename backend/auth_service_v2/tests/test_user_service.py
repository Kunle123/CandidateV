"""
Test user service functionality
"""
import pytest
from sqlalchemy.orm import Session
from app.services.user import create_user
from app.db.models import User

def test_create_regular_user(db_session):
    """Test creating a regular user"""
    user_data = {
        "email": "test_service@example.com",
        "password": "test_password123",
        "name": "Test Service User"
    }
    
    user = create_user(db_session, user_data)
    assert user.id is not None
    assert user.email == user_data["email"]
    assert user.name == user_data["name"]
    assert user.hashed_password == user_data["password"]  # Note: This is temporary for testing
    assert user.is_superuser is False
    assert user.is_active is True
    assert user.email_verified is False

def test_create_superuser(db_session):
    """Test creating a superuser"""
    user_data = {
        "email": "admin_service@example.com",
        "password": "admin_password123",
        "name": "Admin Service User",
        "is_superuser": True
    }
    
    user = create_user(db_session, user_data)
    assert user.id is not None
    assert user.email == user_data["email"]
    assert user.name == user_data["name"]
    assert user.hashed_password == user_data["password"]  # Note: This is temporary for testing
    assert user.is_superuser is True
    assert user.is_active is True
    assert user.email_verified is False

def test_create_user_duplicate_email(db_session):
    """Test creating a user with duplicate email"""
    user_data = {
        "email": "duplicate@example.com",
        "password": "test_password123",
        "name": "Test User"
    }
    
    # Create first user
    create_user(db_session, user_data)
    
    # Try to create second user with same email
    with pytest.raises(Exception):  # Should raise an integrity error
        create_user(db_session, user_data)

def test_create_user(db_session: Session):
    """Test creating a user through the service function"""
    user_data = {
        "email": "service_test@example.com",
        "name": "Service Test User",
        "password": "test_password",
        "is_superuser": True
    }
    
    user = create_user(db_session, user_data)
    
    assert user is not None
    assert user.email == user_data["email"]
    assert user.name == user_data["name"]
    assert user.hashed_password == user_data["password"]  # Note: This is temporary for testing
    assert user.is_superuser is True
    
    # Verify user was actually saved to database
    saved_user = db_session.query(User).filter_by(email=user_data["email"]).first()
    assert saved_user is not None
    assert saved_user.id == user.id
    
    # Cleanup
    db_session.delete(user)
    db_session.commit() 