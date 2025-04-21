"""Health check endpoint."""
from fastapi import APIRouter, Depends
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.api.deps.db import get_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Health check endpoint that verifies database connectivity
    """
    logger.info("Health check endpoint hit")
    try:
        # Execute a simple query to test database connection
        logger.debug("Executing test query...")
        result = await db.execute(text("SELECT 1"))
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