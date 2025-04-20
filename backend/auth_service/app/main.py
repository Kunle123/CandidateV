from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware # Re-enable CORS
import logging
import os
import time
import uuid
from .auth import router as auth_router # <-- Re-enabled
from .health import router as health_router # <-- Re-enabled
from .middleware import setup_rate_limiter # <-- Re-enabled
from .database import Base, engine # <-- Keep enabled

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="CandidateV Authentication Service", # Restore original title
    description="Authentication service for the CandidateV application",
    version="1.0.0",
)

# Configure CORS - Re-enabled
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
@app.middleware("http") # <-- Re-enabled
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
app.include_router(auth_router) # <-- Re-enabled
app.include_router(health_router) # <-- Re-enabled

@app.on_event("startup") # <-- Keep enabled event handler
async def startup():
    logger.info("Starting up Authentication Service") # Restore original log
    # DB interaction 
    try:
        logger.info("Attempting DB table creation...") 
        Base.metadata.create_all(bind=engine) # <-- Keep enabled
        logger.info("Database tables checked/created.")
    except Exception as e:
        logger.error(f"DB Error during startup table creation: {e}", exc_info=True)
        raise e 
    await setup_rate_limiter() # <-- Re-enabled

@app.on_event("shutdown") # <-- Keep enabled event handler
async def shutdown():
    logger.info("Shutting down Authentication Service")

@app.get("/")
async def root():
    # Basic root endpoint must exist
    return {"message": "CandidateV Authentication Service"} # Restore original message

# Remove minimal health check as health_router should provide it
# @app.get("/api/health") 
# async def minimal_health_check():
#     logger.info("Minimal health check endpoint hit.")
#     return {"status": "healthy", "mode": "db-test"}

# Keep the root health check just in case
@app.get("/health")
async def root_health_check():
    logger.info("Root health check endpoint hit.")
    return {"status": "healthy", "mode": "root"} # Update mode 