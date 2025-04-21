"""Base module for SQLAlchemy models."""
from app.db.models import Base

# Import all models here for Alembic to detect them
from app.db.models import (
    User,
    Role,
    RefreshToken,
    PasswordResetToken,
    EmailVerificationToken,
    Token,
    AuditLog,
) 