from fastapi import APIRouter
from datetime import datetime
import os
import logging
import httpx

router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)

# OpenAI API URL for health check
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

class HealthCheck:
    def __init__(self):
        self.status = "healthy"
        self.timestamp = datetime.utcnow()
        self.version = "1.0.0"
        self.openai_connection = "ok"
        self.openai_details = {}
        self.cv_service_connection = "ok"
        self.cv_service_details = {}

@router.get("/health")
async def health_check():
    """Health check endpoint that verifies OpenAI API and CV Service connectivity."""
    
    health = HealthCheck()
    
    # Check OpenAI API connection
    if OPENAI_API_KEY:
        try:
            # Import here to avoid loading the module if API key isn't set
            from openai import OpenAI
            
            # Create a client and make a minimal API call to check connectivity
            start_time = datetime.utcnow()
            client = OpenAI(api_key=OPENAI_API_KEY)
            # Just call models.list() without any parameters
            models = client.models.list()
            end_time = datetime.utcnow()
            
            # Calculate response time in milliseconds
            response_time_ms = (end_time - start_time).total_seconds() * 1000
            health.openai_details["response_time_ms"] = round(response_time_ms, 2)
            health.openai_details["models_available"] = True
            
        except Exception as e:
            health.openai_connection = "error"
            logger.error(f"OpenAI API health check failed: {str(e)}")
            health.openai_details["error"] = str(e)
    else:
        health.openai_connection = "error"
        health.openai_details["error"] = "OPENAI_API_KEY not set"
    
    # Check CV Service connection
    cv_service_url = os.getenv("CV_SERVICE_URL", "http://localhost:8002")
    try:
        # Try to connect to the CV service health endpoint
        async with httpx.AsyncClient(timeout=5.0) as client:
            start_time = datetime.utcnow()
            response = await client.get(f"{cv_service_url}/api/health")
            end_time = datetime.utcnow()
            
            # Calculate response time in milliseconds
            response_time_ms = (end_time - start_time).total_seconds() * 1000
            health.cv_service_details["response_time_ms"] = round(response_time_ms, 2)
            
            if response.status_code != 200:
                health.cv_service_connection = "error"
                health.cv_service_details["status_code"] = response.status_code
        
    except Exception as e:
        health.cv_service_connection = "error"
        logger.error(f"CV service health check failed: {str(e)}")
        health.cv_service_details["error"] = str(e)
    
    # Set overall status based on connections
    if health.openai_connection == "error" or health.cv_service_connection == "error":
        health.status = "unhealthy"
    
    # Return health data as a dictionary
    return health.__dict__ 