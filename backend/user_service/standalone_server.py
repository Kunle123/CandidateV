from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import logging
import sys
from datetime import datetime
import time
import uuid

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("user_service")

# Create a simple FastAPI app
app = FastAPI(title="CandidateV User Service")

# CORS configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost,http://localhost:3000,http://127.0.0.1:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add request ID middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    start_time = time.time()
    
    logger.info(f"Request started: {request.method} {request.url.path} (ID: {request_id})")
    
    try:
        response = await call_next(request)
        
        process_time = time.time() - start_time
        status_code = response.status_code
        logger.info(f"Request completed: {request.method} {request.url.path} "
                   f"(ID: {request_id}) - Status: {status_code} - Time: {process_time:.3f}s")
        
        response.headers["X-Request-ID"] = request_id
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"Request failed: {request.method} {request.url.path} "
                    f"(ID: {request_id}) - Error: {str(e)} - Time: {process_time:.3f}s")
        
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "request_id": request_id}
        )

# Routes
@app.get("/")
async def root():
    return {"message": "CandidateV User Service"}

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "database_connection": "ok",
        "auth_service_connection": "ok"
    }

# Minimal user route to test connectivity
@app.get("/api/users/me")
async def get_current_user_profile():
    # Simulating a real user profile
    return {
        "id": "test-user-id",
        "email": "test@example.com",
        "name": "Test User",
        "bio": "This is a test user profile for development.",
        "job_title": "Developer",
        "location": "Test Location",
        "website": "https://example.com",
        "social_links": {
            "linkedin": "https://linkedin.com/in/testuser",
            "github": "https://github.com/testuser"
        },
        "preferences": {
            "theme": "light",
            "notifications": True
        },
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

# Route to test error handling
@app.get("/api/test-error")
async def test_error():
    # Deliberately raise an error to test error handling
    raise HTTPException(status_code=500, detail="This is a test error")

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8001"))
    logger.info(f"Starting Standalone User Service on port {port}")
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info") 