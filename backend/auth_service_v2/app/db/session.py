"""Database session configuration."""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import text
from typing import AsyncGenerator
from ..core.config import settings
import logging
from tenacity import retry, stop_after_attempt, wait_exponential, before_log, after_log
import os

logger = logging.getLogger(__name__)

# Get database URL with priority for Railway's environment variable
database_url = os.getenv("DATABASE_URL") or settings.DATABASE_URL or settings.SQLALCHEMY_DATABASE_URI

# Convert database URL to async format if needed
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://")

# Create async engine
engine = create_async_engine(
    database_url,
    pool_size=10,  # Increased pool size
    max_overflow=20,  # Increased max overflow
    pool_timeout=30,  # Reduced pool timeout
    pool_pre_ping=True,  # Enable connection health checks
    pool_recycle=300,  # Recycle connections every 5 minutes
    echo=settings.DEBUG,  # SQL logging in debug mode
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    before=before_log(logger, logging.INFO),
    after=after_log(logger, logging.WARN),
)
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Get async database session with proper error handling and connection management.
    Includes retry logic for transient database connection issues.
    """
    async with AsyncSessionLocal() as session:
        try:
            # Verify connection is alive
            await session.execute(text("SELECT 1"))
            yield session
        except Exception as e:
            logger.error(f"Database session error: {str(e)}")
            await session.rollback()
            raise

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    before=before_log(logger, logging.INFO),
    after=after_log(logger, logging.WARN),
)
async def verify_database_connection() -> bool:
    """
    Verify database connection is working.
    Returns True if connection is successful, False otherwise.
    """
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            return True
    except Exception as e:
        logger.error(f"Database connection verification failed: {str(e)}")
        return False

async def init_db() -> None:
    """
    Initialize database with required tables and initial data.
    """
    from ..db.models import Base
    try:
        async with engine.begin() as conn:
            # Create tables if they don't exist
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")
        raise

async def cleanup_expired_tokens() -> None:
    """
    Cleanup expired tokens from the database.
    """
    from datetime import datetime
    from ..db.models import RefreshToken, PasswordResetToken, EmailVerificationToken
    
    async with AsyncSessionLocal() as session:
        try:
            now = datetime.utcnow()
            
            # Delete expired tokens in batches to avoid memory issues
            batch_size = 1000
            
            # Delete expired refresh tokens
            while True:
                stmt = RefreshToken.__table__.delete().where(
                    RefreshToken.expires_at < now
                ).limit(batch_size)
                result = await session.execute(stmt)
                if result.rowcount == 0:
                    break
                await session.commit()
            
            # Delete expired password reset tokens
            while True:
                stmt = PasswordResetToken.__table__.delete().where(
                    PasswordResetToken.expires_at < now
                ).limit(batch_size)
                result = await session.execute(stmt)
                if result.rowcount == 0:
                    break
                await session.commit()
            
            # Delete expired email verification tokens
            while True:
                stmt = EmailVerificationToken.__table__.delete().where(
                    EmailVerificationToken.expires_at < now
                ).limit(batch_size)
                result = await session.execute(stmt)
                if result.rowcount == 0:
                    break
                await session.commit()
            
            logger.info("Expired tokens cleaned up successfully")
        except Exception as e:
            logger.error(f"Failed to cleanup expired tokens: {str(e)}")
            await session.rollback()
            raise 