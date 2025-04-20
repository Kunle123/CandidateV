"""Tests for user models."""
import pytest
from pydantic import ValidationError, EmailStr

from app.models.user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserInDBBase,
    User,
    UserInDB
)

def test_user_base():
    """Test UserBase model."""
    # Test with default values
    user = UserBase()
    assert user.email is None
    assert user.is_active is True
    assert user.is_superuser is False
    assert user.name is None
    assert user.roles == []

    # Test with all fields
    user = UserBase(
        email="test@example.com",
        is_active=False,
        is_superuser=True,
        name="Test User",
        roles=["admin", "user"]
    )
    assert user.email == "test@example.com"
    assert user.is_active is False
    assert user.is_superuser is True
    assert user.name == "Test User"
    assert user.roles == ["admin", "user"]

    # Test validation errors
    with pytest.raises(ValidationError):
        UserBase(email="invalid-email")  # Invalid email format

def test_user_create():
    """Test UserCreate model."""
    # Test with required fields
    user = UserCreate(
        email="test@example.com",
        password="testpass123",
        name="Test User"
    )
    assert user.email == "test@example.com"
    assert user.password == "testpass123"
    assert user.name == "Test User"
    assert user.is_active is True  # Default value
    assert user.is_superuser is False  # Default value
    assert user.roles == []  # Default value

    # Test with all fields
    user = UserCreate(
        email="test@example.com",
        password="testpass123",
        name="Test User",
        is_active=False,
        is_superuser=True,
        roles=["admin"]
    )
    assert user.email == "test@example.com"
    assert user.password == "testpass123"
    assert user.name == "Test User"
    assert user.is_active is False
    assert user.is_superuser is True
    assert user.roles == ["admin"]

    # Test validation errors
    with pytest.raises(ValidationError):
        UserCreate(
            email="test@example.com",
            password="short",  # Too short password
            name="Test User"
        )

    with pytest.raises(ValidationError):
        UserCreate(
            email="invalid-email",  # Invalid email
            password="testpass123",
            name="Test User"
        )

    with pytest.raises(ValidationError):
        UserCreate(
            email="test@example.com",
            password="testpass123"
            # Missing required name
        )

def test_user_update():
    """Test UserUpdate model."""
    # Test with no fields (all optional)
    user = UserUpdate()
    assert user.email is None
    assert user.password is None
    assert user.name is None
    assert user.is_active is True
    assert user.is_superuser is False
    assert user.roles == []

    # Test with all fields
    user = UserUpdate(
        email="test@example.com",
        password="newpass123",
        name="Updated Name",
        is_active=False,
        is_superuser=True,
        roles=["admin"]
    )
    assert user.email == "test@example.com"
    assert user.password == "newpass123"
    assert user.name == "Updated Name"
    assert user.is_active is False
    assert user.is_superuser is True
    assert user.roles == ["admin"]

    # Test validation errors
    with pytest.raises(ValidationError):
        UserUpdate(password="short")  # Too short password

def test_user_in_db_base():
    """Test UserInDBBase model."""
    # Test with default values
    user = UserInDBBase()
    assert user.id is None
    assert user.email is None
    assert user.name is None
    assert user.is_active is True
    assert user.is_superuser is False
    assert user.roles == []

    # Test with all fields
    user = UserInDBBase(
        id=1,
        email="test@example.com",
        name="Test User",
        is_active=False,
        is_superuser=True,
        roles=["admin"]
    )
    assert user.id == 1
    assert user.email == "test@example.com"
    assert user.name == "Test User"
    assert user.is_active is False
    assert user.is_superuser is True
    assert user.roles == ["admin"]

def test_user():
    """Test User model."""
    # Test inheritance from UserInDBBase
    user = User(
        id=1,
        email="test@example.com",
        name="Test User"
    )
    assert isinstance(user, UserInDBBase)
    assert user.id == 1
    assert user.email == "test@example.com"
    assert user.name == "Test User"

def test_user_in_db():
    """Test UserInDB model."""
    # Test with required fields
    user = UserInDB(
        hashed_password="hashedpass123"
    )
    assert user.hashed_password == "hashedpass123"
    assert user.id is None  # Default value
    assert user.email is None  # Default value

    # Test with all fields
    user = UserInDB(
        id=1,
        email="test@example.com",
        name="Test User",
        is_active=True,
        is_superuser=False,
        roles=["user"],
        hashed_password="hashedpass123"
    )
    assert user.id == 1
    assert user.email == "test@example.com"
    assert user.name == "Test User"
    assert user.is_active is True
    assert user.is_superuser is False
    assert user.roles == ["user"]
    assert user.hashed_password == "hashedpass123"

    # Test validation errors
    with pytest.raises(ValidationError):
        UserInDB()  # Missing required hashed_password 