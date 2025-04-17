from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
import os
from contextlib import contextmanager
import logging
import time
import random
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import sqlalchemy

# Configure logging
logger = logging.getLogger("database")

# Get database URL, with a default SQLite configuration for development
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    logger.warning("DATABASE_URL environment variable not set. Using SQLite for development.")
    DATABASE_URL = "sqlite:///./user_service.db"

# Determine if using SQLite
is_sqlite = DATABASE_URL.startswith('sqlite:')

# Configure engine based on database type
if is_sqlite:
    # SQLite settings
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},  # Needed for SQLite
    )
    logger.info(f"Using SQLite database: {DATABASE_URL}")
else:
    # PostgreSQL settings
    engine = create_engine(
        DATABASE_URL,
        poolclass=QueuePool,
        pool_size=int(os.getenv("DB_POOL_SIZE", "10")),
        max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "20")),
        pool_timeout=int(os.getenv("DB_POOL_TIMEOUT", "30")),
        pool_recycle=int(os.getenv("DB_POOL_RECYCLE", "1800")),
        pool_pre_ping=True,  # Check connection before using it from the pool
    )
    logger.info(f"Using PostgreSQL database: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else DATABASE_URL}")
    logger.info(f"Database pool settings: size={engine.pool.size()}, max_overflow={engine.pool._max_overflow}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Define retryable database exceptions
from sqlalchemy.exc import OperationalError, IntegrityError, StatementError

@contextmanager
def get_db():
    """Provide a transactional scope around a series of operations."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        logger.error(f"Database error occurred: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

# Retry decorator for database operations
@retry(
    retry=retry_if_exception_type((OperationalError, StatementError)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=0.5, max=2),
    before_sleep=lambda retry_state: logger.warning(
        f"Retrying database operation: attempt {retry_state.attempt_number} after error: {retry_state.outcome.exception()}"
    )
)
def execute_with_retry(session, operation, *args, **kwargs):
    """Execute a database operation with retry logic."""
    try:
        return operation(*args, **kwargs)
    except (OperationalError, StatementError) as e:
        logger.error(f"Database operation failed: {str(e)}")
        session.rollback()
        raise

def get_db_session():
    """Get a database session for dependency injection in FastAPI."""
    with get_db() as session:
        yield session

def check_db_connection():
    """Check database connection and return status information."""
    try:
        with engine.connect() as connection:
            connection.execute(sqlalchemy.text("SELECT 1"))
        
        # Get pool information if using PostgreSQL
        if not is_sqlite:
            pool_info = {
                "pool_size": engine.pool.size(),
                "checkedin": engine.pool.checkedin(),
                "overflow": engine.pool.overflow(),
                "checkedout": engine.pool.checkedout(),
            }
            return True, pool_info
        return True, {"type": "sqlite"}
    except Exception as e:
        logger.error(f"Database connection check failed: {str(e)}")
        return False, {"error": str(e)} 