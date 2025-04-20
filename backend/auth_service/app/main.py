from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
import time
import uuid
from .auth import router as auth_router
from .health import router as health_router
from .middleware import setup_rate_limiter
from .database import Base, engine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="CandidateV Authentication Service",
    description="Authentication service for the CandidateV application",
    version="1.0.0",
)

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "https://candidate-v.vercel.app,http://localhost:3000,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"]
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
app.include_router(auth_router)
app.include_router(health_router)

@app.on_event("startup")
async def startup():
    logger.info("Starting up Authentication Service")
    # Re-enable DB interaction now that DATABASE_URL reference is hopefully fixed
    try:
        logger.info("Creating database tables if they don't exist...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables checked/created.")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}", exc_info=True)
        # Depending on the error, you might want to prevent startup
        raise e # Re-enable raising the error to see it clearly if it persists
    await setup_rate_limiter()

@app.on_event("shutdown")
async def shutdown():
    logger.info("Shutting down Authentication Service")

@app.get("/")
async def root():
    return {"message": "CandidateV Authentication Service"}

@app.get("/health")
async def root_health_check():
    """Root-level health check endpoint for container health checks"""
    return {"status": "healthy"} 

# Add direct CORS test endpoint
@app.get("/api/cors-test")
async def cors_test():
    """Test endpoint to verify CORS is working properly."""
    return {
        "status": "success",
        "message": "CORS test successful",
        "service": "auth",
        "cors_origins": cors_origins
    }