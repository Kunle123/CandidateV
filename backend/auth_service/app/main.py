from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
import time
import uuid
from .auth import router as auth_router
from .health import router as health_router
from .middleware import setup_rate_limiter

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
app.include_router(auth_router)
app.include_router(health_router)

@app.on_event("startup")
async def startup():
    logger.info("Starting up Authentication Service")
    await setup_rate_limiter()

@app.on_event("shutdown")
async def shutdown():
    logger.info("Shutting down Authentication Service")

@app.get("/")
async def root():
    return {"message": "CandidateV Authentication Service"} 