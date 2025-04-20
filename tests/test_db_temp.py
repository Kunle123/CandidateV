"""
Test database session functionality
"""
import pytest
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text
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