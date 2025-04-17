from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import sqlalchemy

from .database import get_db_session, engine
from .schemas import HealthCheck

router = APIRouter(prefix="/api")

@router.get("/health", response_model=HealthCheck)
async def health_check(db: Session = Depends(get_db_session)):
    """Health check endpoint that verifies the database connection."""
    db_status = "ok"
    
    try:
        # Try to execute a simple query to check database connectivity
        with engine.connect() as connection:
            connection.execute(sqlalchemy.text("SELECT 1"))
    except Exception:
        db_status = "error"
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0",
        "database_connection": db_status
    } 