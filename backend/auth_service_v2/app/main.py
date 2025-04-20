from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.sql import text
import logging
from alembic import command
from alembic.config import Config
import os

from .core.config import settings
from .db.session import AsyncSessionLocal, engine, verify_database_connection
from .api.v1.api import api_router
from .core.rate_limiter import RateLimitMiddleware

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

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    try:
        # Verify database connection
        if not await verify_database_connection():
            logger.error("Failed to connect to database")
            raise RuntimeError("Database connection failed")
        
        # Run migrations
        try:
            alembic_cfg = Config("alembic.ini")
            command.upgrade(alembic_cfg, "head")
            logger.info("Database migrations completed successfully")
        except Exception as e:
            logger.error(f"Failed to run migrations: {str(e)}")
            raise
            
        logger.info("Application startup completed successfully")
    except Exception as e:
        logger.error(f"Application startup failed: {str(e)}")
        raise

@app.get("/")
async def root():
    return {"message": "CandidateV Authentication Service"} 