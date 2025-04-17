import pytest
from datetime import datetime, timedelta
import uuid
from app import services
from app.models import User, RefreshToken, ResetToken


def test_create_user(db_session):
    """Test user creation."""
    user = services.create_user(db_session, "user1@example.com", "password123", "User One")
    assert user.id is not None
    assert user.email == "user1@example.com"
    assert user.name == "User One"
    assert user.hashed_password != "password123"  # Password should be hashed
    assert user.is_active is True
    assert user.is_verified is False


def test_get_user_by_email(db_session, test_user):
    """Test retrieving a user by email."""
    user = services.get_user_by_email(db_session, "test@example.com")
    assert user is not None
    assert user.id == test_user.id
    assert user.email == test_user.email
    assert user.name == test_user.name
    
    # Test with non-existent email
    user = services.get_user_by_email(db_session, "nonexistent@example.com")
    assert user is None


def test_get_user_by_id(db_session, test_user):
    """Test retrieving a user by ID."""
    user = services.get_user_by_id(db_session, test_user.id)
    assert user is not None
    assert user.id == test_user.id
    assert user.email == test_user.email
    assert user.name == test_user.name
    
    # Test with non-existent ID
    non_existent_id = uuid.uuid4()
    user = services.get_user_by_id(db_session, non_existent_id)
    assert user is None


def test_verify_password():
    """Test password verification."""
    hashed_password = services.get_password_hash("testpassword")
    
    # Correct password
    assert services.verify_password("testpassword", hashed_password) is True
    
    # Incorrect password
    assert services.verify_password("wrongpassword", hashed_password) is False


def test_create_access_token():
    """Test access token creation."""
    user_id = str(uuid.uuid4())
    token = services.create_access_token({"sub": "user@example.com", "user_id": user_id})
    assert token is not None
    assert isinstance(token, str)
    
    # With expiration
    token_with_exp = services.create_access_token(
        {"sub": "user@example.com", "user_id": user_id},
        expires_delta=timedelta(minutes=5)
    )
    assert token_with_exp is not None
    assert isinstance(token_with_exp, str)


def test_create_refresh_token(db_session, test_user):
    """Test refresh token creation."""
    token = services.create_refresh_token(db_session, test_user.id)
    assert token is not None
    assert token.user_id == test_user.id
    assert token.token is not None
    assert token.expires_at > datetime.utcnow()
    assert token.revoked is False


def test_verify_refresh_token(db_session, test_refresh_token):
    """Test refresh token verification."""
    # Valid token
    token = services.verify_refresh_token(db_session, test_refresh_token.token)
    assert token is not None
    assert token.id == test_refresh_token.id
    
    # Invalid token
    token = services.verify_refresh_token(db_session, "invalid_token")
    assert token is None
    
    # Revoked token
    test_refresh_token.revoked = True
    db_session.commit()
    token = services.verify_refresh_token(db_session, test_refresh_token.token)
    assert token is None
    
    # Reset token for other tests
    test_refresh_token.revoked = False
    db_session.commit()


def test_revoke_refresh_token(db_session, test_refresh_token):
    """Test revoking a refresh token."""
    # Valid token
    success = services.revoke_refresh_token(db_session, test_refresh_token.token)
    assert success is True
    
    # Verify token is revoked
    token = db_session.query(RefreshToken).filter(RefreshToken.id == test_refresh_token.id).first()
    assert token.revoked is True
    
    # Invalid token
    success = services.revoke_refresh_token(db_session, "invalid_token")
    assert success is False


def test_revoke_all_user_tokens(db_session, test_user):
    """Test revoking all refresh tokens for a user."""
    # Create multiple tokens
    token1 = services.create_refresh_token(db_session, test_user.id)
    token2 = services.create_refresh_token(db_session, test_user.id)
    token3 = services.create_refresh_token(db_session, test_user.id)
    
    # Revoke all tokens
    count = services.revoke_all_user_tokens(db_session, test_user.id)
    assert count == 3
    
    # Verify all tokens are revoked
    tokens = db_session.query(RefreshToken).filter(RefreshToken.user_id == test_user.id).all()
    for token in tokens:
        assert token.revoked is True


def test_create_password_reset_token(db_session, test_user):
    """Test password reset token creation."""
    token = services.create_password_reset_token(db_session, test_user.id)
    assert token is not None
    assert token.user_id == test_user.id
    assert token.token is not None
    assert token.expires_at > datetime.utcnow()
    assert token.used is False


def test_verify_reset_token(db_session, test_reset_token):
    """Test reset token verification."""
    # Valid token
    token = services.verify_reset_token(db_session, test_reset_token.token)
    assert token is not None
    assert token.id == test_reset_token.id
    
    # Invalid token
    token = services.verify_reset_token(db_session, "invalid_token")
    assert token is None
    
    # Used token
    test_reset_token.used = True
    db_session.commit()
    token = services.verify_reset_token(db_session, test_reset_token.token)
    assert token is None
    
    # Reset token for other tests
    test_reset_token.used = False
    db_session.commit()


def test_mark_reset_token_used(db_session, test_reset_token):
    """Test marking a reset token as used."""
    # Valid token
    success = services.mark_reset_token_used(db_session, test_reset_token.id)
    assert success is True
    
    # Verify token is marked as used
    token = db_session.query(ResetToken).filter(ResetToken.id == test_reset_token.id).first()
    assert token.used is True
    
    # Invalid token
    success = services.mark_reset_token_used(db_session, uuid.uuid4())
    assert success is False


def test_reset_password(db_session, test_user):
    """Test password reset."""
    # Valid user
    old_password_hash = test_user.hashed_password
    success = services.reset_password(db_session, test_user.id, "newpassword123")
    assert success is True
    
    # Verify password is changed
    user = db_session.query(User).filter(User.id == test_user.id).first()
    assert user.hashed_password != old_password_hash
    assert services.verify_password("newpassword123", user.hashed_password) is True
    
    # Invalid user
    success = services.reset_password(db_session, uuid.uuid4(), "anotherpassword")
    assert success is False


def test_clean_expired_tokens(db_session, test_user):
    """Test cleaning up expired tokens."""
    # Create expired refresh token
    expired_refresh = RefreshToken(
        id=uuid.uuid4(),
        user_id=test_user.id,
        token="expired_refresh",
        expires_at=datetime.utcnow() - timedelta(days=1),
        created_at=datetime.utcnow() - timedelta(days=2)
    )
    db_session.add(expired_refresh)
    
    # Create expired reset token
    expired_reset = ResetToken(
        id=uuid.uuid4(),
        user_id=test_user.id,
        token="expired_reset",
        expires_at=datetime.utcnow() - timedelta(days=1),
        created_at=datetime.utcnow() - timedelta(days=2)
    )
    db_session.add(expired_reset)
    
    # Create used reset token
    used_reset = ResetToken(
        id=uuid.uuid4(),
        user_id=test_user.id,
        token="used_reset",
        expires_at=datetime.utcnow() + timedelta(days=1),
        created_at=datetime.utcnow() - timedelta(days=1),
        used=True
    )
    db_session.add(used_reset)
    
    db_session.commit()
    
    # Clean up
    result = services.clean_expired_tokens(db_session)
    assert result["refresh_tokens"] == 1  # One expired refresh token
    assert result["reset_tokens"] == 2  # One expired reset token and one used reset token
    
    # Verify tokens are cleaned up
    refresh_count = db_session.query(RefreshToken).filter(RefreshToken.token == "expired_refresh").count()
    assert refresh_count == 0
    
    reset_count = db_session.query(ResetToken).filter(ResetToken.token == "expired_reset").count()
    assert reset_count == 0
    
    used_count = db_session.query(ResetToken).filter(ResetToken.token == "used_reset").count()
    assert used_count == 0 