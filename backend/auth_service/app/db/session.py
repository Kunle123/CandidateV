from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from typing import Generator
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)

# Create engine with connection pooling
engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    poolclass=QueuePool,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_pre_ping=True,
    pool_recycle=3600,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    """
    Get database session with proper error handling and connection management.
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
        db.execute("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"Database connection verification failed: {str(e)}")
        return False
    finally:
        db.close() 