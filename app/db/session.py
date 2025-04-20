from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from typing import Generator
from ..core.config import settings
import logging
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

# Override database URL to use Railway's proxy URL for all environments
RAILWAY_PUBLIC_HOST = "switchback.proxy.rlwy.net"
RAILWAY_PUBLIC_PORT = "29421"
DATABASE_URL = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{RAILWAY_PUBLIC_HOST}:{RAILWAY_PUBLIC_PORT}/railway"

# Create engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_pre_ping=True,
    pool_recycle=3600,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
)
def get_db() -> Generator[Session, None, None]:
    """
    Get database session with proper error handling and connection management.
    Includes retry logic for transient database connection issues.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

def verify_database_connection() -> bool:
    """
    Verify database connection is working.
    Returns True if connection is successful, False otherwise.
    """
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Database connection verification failed: {str(e)}")
        return False
    finally:
        db.close()

def init_db() -> None:
    """
    Initialize database with required tables and initial data.
    """
    from ..db.models import Base
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")
        raise

def cleanup_expired_tokens() -> None:
    """
    Cleanup expired tokens from the database.
    """
    from datetime import datetime
    from ..db.models import RefreshToken, PasswordResetToken, EmailVerificationToken
    
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        
        # Delete expired refresh tokens
        db.query(RefreshToken).filter(
            RefreshToken.expires_at < now
        ).delete()
        
        # Delete expired password reset tokens
        db.query(PasswordResetToken).filter(
            PasswordResetToken.expires_at < now
        ).delete()
        
        # Delete expired email verification tokens
        db.query(EmailVerificationToken).filter(
            EmailVerificationToken.expires_at < now
        ).delete()
        
        db.commit()
        logger.info("Expired tokens cleaned up successfully")
    except Exception as e:
        logger.error(f"Failed to cleanup expired tokens: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close() 