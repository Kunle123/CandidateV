from fastapi import APIRouter
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends
import os
from app.core.config import settings
from app.db.session import get_db
from datetime import datetime

router = APIRouter()

@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Health check endpoint that returns service status, version, and environment information.
    """
    try:
        # Test database connection
        await db.execute("SELECT 1")
        return {
            "status": "healthy",
            "database": "connected",
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
            "project_name": settings.PROJECT_NAME,
            "debug_mode": settings.DEBUG,
            "timestamp": str(datetime.utcnow()),
            "message": "Service is running normally"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
            "project_name": settings.PROJECT_NAME,
            "debug_mode": settings.DEBUG,
            "timestamp": str(datetime.utcnow()),
            "message": str(e)
        } 