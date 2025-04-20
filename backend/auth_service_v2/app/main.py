from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.sql import text
import logging
from alembic import command
from alembic.config import Config
import os
import asyncio
from pathlib import Path
import traceback

from .core.config import settings
from .db.session import AsyncSessionLocal, engine, verify_database_connection, init_db
from .api.v1.api import api_router
from .core.rate_limiter import RateLimitMiddleware

# Configure logging
logging.basicConfig(level=logging.DEBUG if settings.DEBUG else logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app with detailed error handling
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    debug=settings.DEBUG
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting middleware
app.add_middleware(RateLimitMiddleware)

# Add routers
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.middleware("http")
async def db_session_middleware(request: Request, call_next):
    """Middleware to handle database sessions and log errors."""
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        logger.error(f"Request failed: {request.url.path}")
        logger.error(f"Error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "path": request.url.path,
                "method": request.method,
                "error": str(e) if settings.DEBUG else "Internal server error"
            }
        )

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    try:
        # Log startup information
        logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")
        logger.info(f"Debug mode: {settings.DEBUG}")
        logger.info(f"Environment: {settings.ENVIRONMENT}")
        
        # Verify database connection
        logger.info("Verifying database connection...")
        if not await verify_database_connection():
            logger.error("Failed to connect to database")
            raise RuntimeError("Database connection failed")
        logger.info("Database connection verified")
        
        # Initialize database tables
        logger.info("Initializing database tables...")
        await init_db()
        logger.info("Database tables initialized successfully")
        
        # Log successful startup
        logger.info("Application startup completed successfully")
    except Exception as e:
        logger.error(f"Application startup failed: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown."""
    try:
        # Close any remaining database connections
        await engine.dispose()
        logger.info("Database connections closed")
        logger.info("Application shutdown completed")
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise

@app.get("/")
async def root():
    return {"message": "CandidateV Authentication Service"} 