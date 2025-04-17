from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import sqlalchemy
import os
import logging
import httpx
import asyncio

from .database import get_db_session, engine
from .schemas import HealthCheck

router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)

# Auth service URL from environment variable
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:8000")

@router.get("/health", response_model=HealthCheck)
async def health_check(db: Session = Depends(get_db_session)):
    """Health check endpoint that verifies the database connection and auth service connectivity."""
    
    # Check database connection
    db_status = "ok"
    db_details = {}
    
    try:
        # Try to execute a simple query to check database connectivity
        start_time = datetime.utcnow()
        with engine.connect() as connection:
            connection.execute(sqlalchemy.text("SELECT 1"))
        end_time = datetime.utcnow()
        
        # Calculate query time in milliseconds
        query_time_ms = (end_time - start_time).total_seconds() * 1000
        db_details["query_time_ms"] = round(query_time_ms, 2)
        
        # Get database type and connection info
        is_sqlite = os.getenv("DATABASE_URL", "").startswith('sqlite:')
        db_details["type"] = "SQLite" if is_sqlite else "PostgreSQL"
        
        # Get connection pool stats if PostgreSQL
        if not is_sqlite:
            pool_status = {
                "pool_size": engine.pool.size(),
                "checkedin": engine.pool.checkedin(),
                "overflow": engine.pool.overflow(),
                "checkedout": engine.pool.checkedout(),
            }
            db_details["pool"] = pool_status
    except Exception as e:
        db_status = "error"
        logger.error(f"Database health check failed: {str(e)}")
        db_details["error"] = str(e)
    
    # Check auth service connection
    auth_status = "ok"
    auth_details = {}
    
    try:
        # Try to connect to the auth service health endpoint
        async with httpx.AsyncClient(timeout=5.0) as client:
            start_time = datetime.utcnow()
            response = await client.get(f"{AUTH_SERVICE_URL}/api/health")
            end_time = datetime.utcnow()
            
            # Calculate response time in milliseconds
            response_time_ms = (end_time - start_time).total_seconds() * 1000
            auth_details["response_time_ms"] = round(response_time_ms, 2)
            
            if response.status_code != 200:
                auth_status = "error"
                auth_details["status_code"] = response.status_code
    except Exception as e:
        auth_status = "error"
        logger.error(f"Auth service health check failed: {str(e)}")
        auth_details["error"] = str(e)
    
    # Combine all health data
    health_data = {
        "status": "healthy" if db_status == "ok" and auth_status == "ok" else "unhealthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0",
        "database_connection": db_status,
        "database_details": db_details,
        "auth_service_connection": auth_status,
        "auth_service_details": auth_details
    }
    
    return health_data 