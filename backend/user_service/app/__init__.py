"""
User Service Module - Provides user profile management capabilities
"""
import logging
from fastapi import FastAPI

# Configure a logger
logger = logging.getLogger("user_service")

# Create the FastAPI application
app = FastAPI(
    title="CandidateV User Service",
    description="User management service for the CandidateV application",
    version="1.0.0",
)

# Import routers after creating app to avoid circular imports
try:
    # First try direct import
    from .health import router as health_router
    from .users import router as users_router
    
    # Include routers
    app.include_router(health_router)
    app.include_router(users_router)
    logger.info("Successfully loaded routers from app package")
except ImportError as e:
    logger.warning(f"Error loading routers from app package: {str(e)}")
    logger.info("Using alternate import method for routers")
    
    try:
        # Try alternate import path
        from backend.user_service.app.health import router as health_router
        from backend.user_service.app.users import router as users_router
        
        # Include routers
        app.include_router(health_router)
        app.include_router(users_router)
        logger.info("Successfully loaded routers from alternate import path")
    except ImportError as e2:
        logger.error(f"Failed to load routers: {str(e2)}")
        logger.warning("Application may not function correctly without routers") 