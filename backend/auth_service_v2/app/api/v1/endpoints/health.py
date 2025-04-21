"""Health check endpoint."""
from fastapi import APIRouter
from datetime import datetime
from sqlalchemy import text
from app.core.config import settings
from app.db.session import AsyncSessionLocal
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/health")
async def health_check():
    """
    Health check endpoint that verifies database connectivity
    """
    logger.info("Health check endpoint hit")
    try:
        # Create a new session for the health check
        logger.debug("Attempting database connection...")
        async with AsyncSessionLocal() as session:
            # Execute a simple query to test database connection
            logger.debug("Executing test query...")
            result = await session.execute(text("SELECT 1"))
            await result.scalar()
            logger.info("Health check successful - database connection verified")
            
            return {
                "status": "healthy",
                "database": "connected",
                "version": settings.VERSION,
                "environment": settings.ENVIRONMENT,
                "project_name": settings.PROJECT_NAME,
                "debug_mode": settings.DEBUG,
                "timestamp": datetime.utcnow().isoformat()
            }
    except Exception as e:
        # Log the error but return a simplified response
        logger.error(f"Health check failed: {str(e)}", exc_info=True)
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e) if settings.DEBUG else "Database connection failed",
            "timestamp": datetime.utcnow().isoformat()
        } 