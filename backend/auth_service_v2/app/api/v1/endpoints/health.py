"""Health check endpoint."""
from fastapi import APIRouter
from datetime import datetime
from sqlalchemy import text
from app.core.config import settings
from app.db.session import AsyncSessionLocal

router = APIRouter()

@router.get("/health")
async def health_check():
    """
    Health check endpoint that verifies database connectivity
    """
    try:
        # Create a new session for the health check
        async with AsyncSessionLocal() as session:
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
        # Log the error but return a simplified response
        print(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e) if settings.DEBUG else "Database connection failed",
            "timestamp": datetime.utcnow().isoformat()
        } 