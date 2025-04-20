"""
Test database session functionality
"""
import pytest
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timedelta
from app.db.session import (
    get_db,
    verify_database_connection,
    init_db,
    cleanup_expired_tokens
)
from app.db.models import (
    RefreshToken,
    PasswordResetToken,
    EmailVerificationToken,
    User
)

def test_verify_database_connection(db_session):
    """Test database connection verification"""
    assert verify_database_connection() is True

def test_init_db(test_db_engine):
    """Test database initialization"""
    init_db()
    # Check if tables exist by trying to create a user
    db = Session(test_db_engine)
    try:
        user = User(
            email="test_init@example.com",
            name="Test Init User",
            hashed_password="test123"
        )
        db.add(user)
        db.commit()
        assert user.id is not None
    finally:
        db.rollback()
        db.close()

def test_cleanup_expired_tokens(db_session):
    """Test cleanup of expired tokens"""
    # Create a test user
    user = User(
        email="test_tokens@example.com",
        name="Test Token User",
        hashed_password="test123"
    )
    db_session.add(user)
    db_session.commit()

    # Create expired tokens
    now = datetime.utcnow()
    expired_time = now - timedelta(days=1)
    valid_time = now + timedelta(days=1)

    # Create expired refresh token
    expired_refresh = RefreshToken(
        token="expired_refresh",
        user_id=user.id,
        expires_at=expired_time
    )
    valid_refresh = RefreshToken(
        token="valid_refresh",
        user_id=user.id,
        expires_at=valid_time
    )

    # Create expired password reset token
    expired_reset = PasswordResetToken(
        token="expired_reset",
        user_id=user.id,
        expires_at=expired_time
    )
    valid_reset = PasswordResetToken(
        token="valid_reset",
        user_id=user.id,
        expires_at=valid_time
    )

    # Create expired email verification token
    expired_verify = EmailVerificationToken(
        token="expired_verify",
        user_id=user.id,
        expires_at=expired_time
    )
    valid_verify = EmailVerificationToken(
        token="valid_verify",
        user_id=user.id,
        expires_at=valid_time
    )

    # Add all tokens
    db_session.add_all([
        expired_refresh, valid_refresh,
        expired_reset, valid_reset,
        expired_verify, valid_verify
    ])
    db_session.commit()

    # Run cleanup
    cleanup_expired_tokens()

    # Verify expired tokens are gone and valid ones remain
    assert db_session.query(RefreshToken).filter_by(token="expired_refresh").first() is None
    assert db_session.query(RefreshToken).filter_by(token="valid_refresh").first() is not None

    assert db_session.query(PasswordResetToken).filter_by(token="expired_reset").first() is None
    assert db_session.query(PasswordResetToken).filter_by(token="valid_reset").first() is not None

    assert db_session.query(EmailVerificationToken).filter_by(token="expired_verify").first() is None
    assert db_session.query(EmailVerificationToken).filter_by(token="valid_verify").first() is not None

def test_get_db():
    """Test database session generator"""
    db = next(get_db())
    try:
        # Try a simple query
        result = db.execute(text("SELECT 1")).scalar()
        assert result == 1
    finally:
        db.close()

def test_get_db_error_handling():
    """Test database session error handling"""
    db = next(get_db())
    try:
        # Try an invalid query to trigger an error
        with pytest.raises(Exception):
            db.execute(text("SELECT * FROM non_existent_table"))
    finally:
        db.close() 