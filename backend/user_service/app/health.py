from fastapi import APIRouter, status
from datetime import datetime
import logging
import os
import httpx
from typing import Optional
import sys

# Configure logger
logger = logging.getLogger("app.health")

# Environment variables
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "https://candidatev-auth-service.up.railway.app")
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Create router
router = APIRouter()

async def check_auth_service() -> dict:
    """Checks if the auth service is available"""
    auth_status = "ok"
    auth_details = {}
    
    try:
        # Try with a generous timeout
        async with httpx.AsyncClient(timeout=5.0) as client:
            start_time = datetime.utcnow()
            response = await client.get(f"{AUTH_SERVICE_URL}/api/health")
            end_time = datetime.utcnow()
            
            response_time = (end_time - start_time).total_seconds() * 1000
            auth_details["response_time_ms"] = round(response_time, 2)
            
            if response.status_code != 200:
                auth_status = "degraded"
                auth_details["status_code"] = response.status_code
                logger.warning(f"Auth service returned status code {response.status_code}")
    except Exception as e:
        auth_status = "degraded"  # Changed from error to degraded
        auth_details["error"] = str(e)
        logger.error(f"Auth service health check failed: {str(e)}")
    
    return {
        "status": auth_status,
        "details": auth_details
    }

async def check_database() -> dict:
    """Checks if the database is available"""
    db_status = "ok"
    db_details = {}
    
    # If no DATABASE_URL, we're in development mode with mock data
    if not DATABASE_URL:
        logger.info("No DATABASE_URL provided, assuming development mode")
        return {
            "status": "mock",
            "details": {"message": "Using mock data, no database connection needed"}
        }
    
    try:
        from sqlalchemy import create_engine
        from sqlalchemy.sql import text
        
        # Create a temporary engine just for health check
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        
        # Test connection with a simple query
        with engine.connect() as conn:
            start_time = datetime.utcnow()
            result = conn.execute(text("SELECT 1"))
            end_time = datetime.utcnow()
            
            if result.fetchone()[0] != 1:
                db_status = "error"
                db_details["error"] = "Database query returned unexpected result"
            else:
                response_time = (end_time - start_time).total_seconds() * 1000
                db_details["response_time_ms"] = round(response_time, 2)
    except ImportError:
        db_status = "warning"
        db_details["error"] = "SQLAlchemy not installed"
        logger.warning("SQLAlchemy not installed, cannot check database health")
    except Exception as e:
        db_status = "error"
        db_details["error"] = str(e)
        logger.error(f"Database health check failed: {str(e)}")
    
    return {
        "status": db_status,
        "details": db_details
    }

@router.get("/api/health", status_code=status.HTTP_200_OK)
async def health_check():
    """Health check endpoint"""
    # Check auth service
    auth_result = await check_auth_service()
    
    # Check database
    db_result = await check_database()
    
    # Overall status is healthy if auth is ok and database is ok or mock
    overall_status = "healthy"
    if auth_result["status"] == "error" and db_result["status"] == "error":
        # Only mark as unhealthy if both are in error state
        overall_status = "unhealthy"
    elif auth_result["status"] != "ok" or db_result["status"] not in ["ok", "mock"]:
        overall_status = "degraded"
    
    return {
        "status": overall_status,
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "auth_service": auth_result,
        "database": db_result,
        "environment": os.getenv("ENVIRONMENT", "development"),
        "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    }

# Simple root health check (for Kubernetes/Railway)
@router.get("/health", status_code=status.HTTP_200_OK)
async def simple_health():
    """Simple health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()} 