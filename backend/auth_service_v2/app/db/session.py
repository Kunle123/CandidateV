from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from typing import Generator
from ..core.config import settings
import logging
from tenacity import retry, stop_after_attempt, wait_exponential
import os

logger = logging.getLogger(__name__)

# Get database URL with priority for Railway's environment variable
database_url = os.getenv("DATABASE_URL") or settings.DATABASE_URL or settings.SQLALCHEMY_DATABASE_URI

# Create engine with connection pooling and adjusted timeouts
engine = create_engine(
    database_url,
    poolclass=QueuePool,
    pool_size=5,
    max_overflow=10,
    pool_timeout=60,  # Increased timeout
    pool_pre_ping=True,
    pool_recycle=1800,  # Reduced recycle time
    connect_args={
        "connect_timeout": 60,  # Increased connection timeout
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@retry(
    stop=stop_after_attempt(5),  # Increased retry attempts
    wait=wait_exponential(multiplier=1, min=4, max=20),  # Adjusted wait times
)
def get_db() -> Generator[Session, None, None]:
    """
    Get database session with proper error handling and connection management.
    Includes retry logic for transient database connection issues.
    """
    db = SessionLocal()
    try:
        # Verify connection is alive
        db.execute(text("SELECT 1"))
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

def cleanup_expired_tokens(db: Session = None) -> None:
    """
    Cleanup expired tokens from the database.
    
    Args:
        db: Optional database session. If not provided, a new session will be created.
    """
    from datetime import datetime
    from ..db.models import RefreshToken, PasswordResetToken, EmailVerificationToken
    
    if db is None:
        db = SessionLocal()
        should_close = True
    else:
        should_close = False
    
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
        if should_close:
            db.close() 