"""Contract tests for validating JWT token format and claims."""
import jwt
import pytest
from datetime import datetime, timedelta

from app.core.config import settings
from app.core.security import create_access_token

def test_access_token_format():
    """Test that access tokens are properly formatted JWTs."""
    test_email = "test@example.com"
    token = create_access_token(subject=test_email)
    
    # Token should be a non-empty string
    assert isinstance(token, str)
    assert len(token) > 0
    
    # Token should be decodable with our secret key
    decoded = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM]
    )
    
    # Check required claims
    assert "sub" in decoded
    assert "exp" in decoded
    assert "iat" in decoded
    
    # Validate claim values
    assert decoded["sub"] == test_email
    assert isinstance(decoded["exp"], int)
    assert isinstance(decoded["iat"], int)
    assert decoded["exp"] > decoded["iat"]

def test_token_expiration():
    """Test that tokens have the correct expiration time."""
    test_email = "test@example.com"
    token = create_access_token(subject=test_email)
    
    decoded = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM]
    )
    
    # Calculate expected expiration time
    expected_expiration = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    actual_expiration = datetime.fromtimestamp(decoded["exp"])
    
    # Allow for small time differences due to test execution
    time_difference = abs((expected_expiration - actual_expiration).total_seconds())
    assert time_difference < 5  # Within 5 seconds

def test_invalid_token_signature():
    """Test that tokens with invalid signatures are rejected."""
    test_email = "test@example.com"
    token = create_access_token(subject=test_email)
    
    # Modify the token to invalidate signature
    modified_token = token[:-1] + ("1" if token[-1] == "0" else "0")
    
    with pytest.raises(jwt.InvalidSignatureError):
        jwt.decode(
            modified_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

def test_expired_token():
    """Test that expired tokens are rejected."""
    test_email = "test@example.com"
    
    # Create token that's already expired
    expired_token = create_access_token(
        subject=test_email,
        expires_delta=timedelta(minutes=-1)
    )
    
    with pytest.raises(jwt.ExpiredSignatureError):
        jwt.decode(
            expired_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        ) 