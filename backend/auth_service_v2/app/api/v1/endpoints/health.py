from fastapi import APIRouter
from datetime import datetime
from sqlalchemy import text
from app.core.config import settings
from app.db.session import db

router = APIRouter()

@router.get("/health")
async def health_check():
    """
    Health check endpoint that verifies database connectivity
    """
    try:
        async with db() as session:
            # Execute a simple query to test database connection
            result = await session.execute(text("SELECT 1"))
            await result.scalar()
            
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
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
            "project_name": settings.PROJECT_NAME,
            "debug_mode": settings.DEBUG,
            "timestamp": datetime.utcnow().isoformat(),
            "message": str(e)
        } 