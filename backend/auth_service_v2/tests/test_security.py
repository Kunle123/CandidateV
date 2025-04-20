"""Test security utilities."""
from datetime import datetime, timedelta
import pytest
from jose import jwt

from app.core.security import (
    create_access_token,
    verify_password,
    get_password_hash
)
from app.core.config import settings

def test_password_hash():
    """Test password hashing and verification."""
    password = "test_password123"
    hashed = get_password_hash(password)
    
    # Test that hashes are different for same password
    assert hashed != get_password_hash(password)
    
    # Test password verification
    assert verify_password(password, hashed) is True
    assert verify_password("wrong_password", hashed) is False

def test_create_access_token():
    """Test JWT access token creation."""
    # Test with explicit expiration
    expires_delta = timedelta(minutes=15)
    token = create_access_token(
        subject="test@example.com",
        expires_delta=expires_delta
    )
    
    # Decode and verify token
    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM]
    )
    assert payload["sub"] == "test@example.com"
    exp = datetime.fromtimestamp(payload["exp"])
    now = datetime.utcnow()
    assert (exp - now).total_seconds() <= expires_delta.total_seconds()

def test_create_access_token_default_expiry():
    """Test JWT access token creation with default expiration."""
    token = create_access_token(subject="test@example.com")
    
    # Decode and verify token
    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM]
    )
    assert payload["sub"] == "test@example.com"
    exp = datetime.fromtimestamp(payload["exp"])
    now = datetime.utcnow()
    expected_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    assert (exp - now).total_seconds() <= expected_delta.total_seconds()

def test_token_invalid_secret():
    """Test token validation with wrong secret key."""
    token = create_access_token(subject="test@example.com")
    
    with pytest.raises(jwt.JWTError):
        jwt.decode(
            token,
            "wrong_secret",
            algorithms=[settings.ALGORITHM]
        )

def test_token_expired():
    """Test expired token validation."""
    token = create_access_token(
        subject="test@example.com",
        expires_delta=timedelta(microseconds=1)
    )
    # Wait for token to expire
    import time
    time.sleep(0.1)
    
    with pytest.raises(jwt.ExpiredSignatureError):
        jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        ) 