from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging
import os
import time
import uuid
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("user_service")

# Create FastAPI app - Don't import this in __init__.py to avoid circular imports
app = FastAPI(
    title="CandidateV User Management Service",
    description="User management service for the CandidateV application",
    version="1.0.0",
)

# Import routers after creating app to avoid circular imports
from .users import router as users_router
from .health import router as health_router

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add request ID and logging middleware
@app.middleware("http")
async def add_request_id_and_log(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    start_time = time.time()
    logger.info(f"Request started: {request.method} {request.url.path} (ID: {request_id})")
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(f"Request completed: {request.method} {request.url.path} "
                f"(ID: {request_id}) - Status: {response.status_code} - Time: {process_time:.3f}s")
    
    response.headers["X-Request-ID"] = request_id
    return response

# Register routers
app.include_router(users_router)
app.include_router(health_router)

# Mount static files if using local storage
USE_LOCAL_STORAGE = os.getenv("USE_LOCAL_STORAGE", "true").lower() == "true"
UPLOAD_DIR = os.getenv("LOCAL_STORAGE_PATH", "./uploads")

if USE_LOCAL_STORAGE:
    logger.info(f"Using local storage for uploads: {UPLOAD_DIR}")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    logger.info(f"Created uploads directory: {UPLOAD_DIR}")
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
else:
    logger.info("Using S3 storage for uploads")
    # Verify S3 credentials are set
    S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
    S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY")
    S3_SECRET_KEY = os.getenv("S3_SECRET_KEY")
    
    if not all([S3_BUCKET_NAME, S3_ACCESS_KEY, S3_SECRET_KEY]):
        logger.warning("S3 storage is enabled but credentials are not fully configured")

@app.on_event("startup")
async def startup():
    logger.info("Starting up User Management Service")

@app.on_event("shutdown")
async def shutdown():
    logger.info("Shutting down User Management Service")

@app.get("/")
async def root():
    return {"message": "CandidateV User Management Service"}

# Run debug server if executed directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8001"))) 