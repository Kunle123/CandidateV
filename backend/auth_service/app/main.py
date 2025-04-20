from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware # Keep CORS
import logging
import os
import time
import uuid
from .auth import router as auth_router # Keep import
from .health import router as health_router # Keep import
# from .middleware import setup_rate_limiter # Keep Commented out
from .database import Base, engine # Keep enabled

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="CandidateV Authentication Service (Health Router Test)", # Modified title
    description="Authentication service for the CandidateV application",
    version="1.0.0",
)

# Configure CORS - Keep enabled
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
# @app.middleware("http") # <-- Keep Commented out
# ...

# Register routers
# app.include_router(auth_router) # <-- Comment out auth_router include
app.include_router(health_router) # <-- Keep health_router include

@app.on_event("startup") 
async def startup():
    logger.info("Starting up Authentication Service (Health Router Test)") # Modified log
    # DB interaction 
    try:
        logger.info("Attempting DB table creation...") 
        Base.metadata.create_all(bind=engine) 
        logger.info("Database tables checked/created.")
    except Exception as e:
        logger.error(f"DB Error during startup table creation: {e}", exc_info=True)
        raise e 
    # await setup_rate_limiter() # <-- Keep Commented out

@app.on_event("shutdown") 
async def shutdown():
    logger.info("Shutting down Authentication Service")

@app.get("/")
async def root():
    return {"message": "CandidateV Authentication Service (Health Router Test)"} 

# Remove minimal health check as health_router is included
# @app.get("/api/health") 
# ...

# Keep the root health check just in case
@app.get("/health")
async def root_health_check():
    logger.info("Root health check endpoint hit.")
    return {"status": "healthy", "mode": "health-router-test-root"} 