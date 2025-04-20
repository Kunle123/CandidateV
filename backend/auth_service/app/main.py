from fastapi import FastAPI, Request, Depends
# from fastapi.middleware.cors import CORSMiddleware # Keep commented for now
import logging
import os
import time
import uuid
# from .auth import router as auth_router # Keep commented out
# from .health import router as health_router # Keep commented out
# from .middleware import setup_rate_limiter # Keep commented out
# from .database import Base, engine # Keep commented out
from contextlib import asynccontextmanager # Import lifespan context manager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# --- Lifespan Context Manager --- 
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code here runs BEFORE the application starts receiving requests
    logger.info("Lifespan: Startup phase beginning...")
    # --- Add initializations here later (DB, Redis, etc.) ---
    # app.state.db_engine = await init_db_engine() # Example placeholder
    yield # Application runs here
    # Code here runs AFTER the application stops receiving requests
    logger.info("Lifespan: Shutdown phase beginning...")
    # --- Add cleanup here later (close connections, etc.) ---
    # await close_db_engine(app.state.db_engine) # Example placeholder

# --- Create FastAPI App --- 
# Assign the lifespan context manager to the app
app = FastAPI(
    title="CandidateV Authentication Service (Lifespan Test)",
    description="Authentication service for the CandidateV application",
    version="1.0.0",
    lifespan=lifespan # Use the lifespan manager
)

# --- Middleware (Keep commented out for now) ---
# cors_origins = ...
# app.add_middleware(CORSMiddleware, ...)
# @app.middleware("http") ...

# --- Routers (Keep commented out for now) ---
# app.include_router(auth_router)
# app.include_router(health_router)

# --- Basic Endpoints for Testing --- 
@app.get("/")
async def root():
    return {"message": "CandidateV Authentication Service (Lifespan Test)"}

# Add a minimal health check 
@app.get("/api/health") 
async def minimal_health_check():
    logger.info("Minimal health check endpoint hit (Lifespan Test).")
    return {"status": "healthy", "mode": "lifespan-test"}

# Keep the root health check just in case
@app.get("/health")
async def root_health_check():
    logger.info("Root health check endpoint hit (Lifespan Test).")
    return {"status": "healthy", "mode": "lifespan-test-root"} 

# --- Remove old startup/shutdown events --- 
# @app.on_event("startup") ... # REMOVED
# @app.on_event("shutdown") ... # REMOVED 