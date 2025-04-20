"""
Test Configuration Documentation

This file contains database integration tests for the Auth Service.
These tests require a test database instance to be running.

Test Configuration:
------------------
1. Test database configuration is loaded from .env file with the following test-specific values:
   - POSTGRES_DB=candidatev_auth_test
   - ENVIRONMENT=test

Cleanup Instructions:
-------------------
When moving to production:
1. Ensure the test database (candidatev_auth_test) is dropped or properly secured
2. Remove or update the test-specific environment variables in .env
3. This test file can be safely removed once the service is deployed and stable

Note: Some tests create temporary data but include cleanup steps. However, if tests fail
unexpectedly, you may need to manually clean up test data using:
   - DELETE FROM users WHERE email LIKE '%test@example.com%';
   - DELETE FROM roles WHERE name LIKE '%test_role%';
"""

import pytest
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.models import User, Role

def test_database_connection(db_session: Session):
    """Test that we can connect to the test database"""
    assert db_session is not None
    result = db_session.execute(text("SELECT 1")).scalar()
    assert result == 1

def test_create_user(db_session: Session):
    """Test that we can create a user in the test database"""
    user = User(
        email="test@example.com",
        name="Test User",
        hashed_password="hashed_password"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    assert user.id is not None
    assert user.email == "test@example.com"
    assert user.name == "Test User"
    assert user.is_active is True
    assert user.is_superuser is False
    assert user.email_verified is False

def test_create_role(db_session: Session):
    """Test that we can create a role in the test database"""
    role = Role(
        name="test_role",
        description="Test role description"
    )
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    
    assert role.id is not None
    assert role.name == "test_role"
    assert role.description == "Test role description"

def test_user_role_relationship(db_session: Session):
    """Test the many-to-many relationship between users and roles"""
    # Create a user
    user = User(
        email="test_relationship@example.com",
        name="Test User",
        hashed_password="hashed_password"
    )
    
    # Create a role with unique name
    role = Role(
        name="test_role_relationship",
        description="Test role description"
    )
    
    # Add role to user
    user.roles.append(role)
    
    db_session.add(user)
    db_session.add(role)
    db_session.commit()
    
    # Verify relationships
    assert len(user.roles) == 1
    assert user.roles[0].name == "test_role_relationship"
    assert len(role.users) == 1
    assert role.users[0].email == "test_relationship@example.com"
    
    # Cleanup
    db_session.delete(user)
    db_session.delete(role)
    db_session.commit()

def test_create_user_with_roles(db_session: Session):
    """Test creating a user with roles"""
    # Create a test role with unique name
    test_role = Role(name="test_role_creation", description="A test role")
    db_session.add(test_role)
    db_session.commit()

    # Create a test user with the role
    test_user = User(
        name="test_user",
        email="test_creation@example.com",
        hashed_password="hashed_password"
    )
    test_user.roles.append(test_role)
    db_session.add(test_user)
    db_session.commit()

    # Query the user and check the role relationship
    user_from_db = db_session.query(User).filter_by(name="test_user").first()
    assert user_from_db is not None
    assert len(user_from_db.roles) == 1
    assert user_from_db.roles[0].name == "test_role_creation"

    # Cleanup
    db_session.delete(test_user)
    db_session.delete(test_role)
    db_session.commit() 