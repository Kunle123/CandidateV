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
import sys

from .core.config import settings
from .db.session import AsyncSessionLocal, engine, verify_database_connection, init_db
from .api.v1.api import api_router
from .core.rate_limiter import RateLimitMiddleware

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
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

# Mount v1 API router at /api instead of /api/v1
app.include_router(api_router, prefix="/api")

async def initialize_database():
    """Initialize database with retries."""
    max_retries = 5
    retry_delay = 5  # seconds
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Database initialization attempt {attempt + 1}/{max_retries}")
            
            # Verify database connection
            if not await verify_database_connection():
                raise RuntimeError("Database connection verification failed")
            
            # Initialize database tables
            await init_db()
            logger.info("Database initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Database initialization attempt {attempt + 1} failed: {str(e)}")
            if attempt < max_retries - 1:
                logger.info(f"Retrying in {retry_delay} seconds...")
                await asyncio.sleep(retry_delay)
            else:
                logger.error("All database initialization attempts failed")
                return False

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    try:
        logger.info("Starting application initialization...")
        
        # Initialize database
        if not await initialize_database():
            logger.error("Failed to initialize database")
            # Don't raise an exception here, let the health check handle it
        
        logger.info("Application startup completed successfully")
    except Exception as e:
        logger.error(f"Application startup failed: {str(e)}")
        # Don't raise an exception, let the health check handle it

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint."""
    try:
        # Check database connection
        if not await verify_database_connection():
            return JSONResponse(
                status_code=503,
                content={"status": "error", "message": "Database connection failed"}
            )
        
        return {
            "status": "healthy",
            "database": "connected",
            "environment": settings.ENVIRONMENT
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={"status": "error", "message": str(e)}
        ) 