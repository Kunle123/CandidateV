from fastapi import FastAPI, Request, Depends
# from fastapi.middleware.cors import CORSMiddleware # Keep commented for now
import logging
import os
import time
import uuid
# from .auth import router as auth_router # Keep commented out
# from .health import router as health_router # Keep commented out
# from .middleware import setup_rate_limiter # Keep commented out
# Import the new functions and Base
from .database import create_db_engine, close_db_engine, Base
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# --- Lifespan Context Manager --- 
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Lifespan: Startup phase beginning...")
    engine_instance = None
    try:
        logger.info("Lifespan: Initializing database engine...")
        engine_instance = create_db_engine() # Create engine here
        app.state.db_engine = engine_instance # Store engine in app state
        logger.info("Lifespan: Database engine created. Attempting table creation...")
        Base.metadata.create_all(bind=engine_instance) # Create tables
        logger.info("Lifespan: Database tables checked/created.")
    except Exception as e:
        logger.critical(f"Lifespan: CRITICAL ERROR during database initialization: {e}", exc_info=True)
        # Optionally: raise ApplicationError("DB init failed") to prevent startup
        # For now, we'll let it proceed but log the critical error
        app.state.db_engine = None # Ensure state reflects failure

    # --- Add other initializations here later (e.g., Redis) ---
    
    logger.info("Lifespan: Startup complete. Yielding control.")
    yield # Application runs here
    
    # Shutdown
    logger.info("Lifespan: Shutdown phase beginning...")
    # --- Add cleanup here later (e.g., Redis) ---
    if hasattr(app.state, 'db_engine') and app.state.db_engine:
        logger.info("Lifespan: Closing database engine pool...")
        close_db_engine(app.state.db_engine)
    logger.info("Lifespan: Shutdown complete.")

# --- Create FastAPI App --- 
app = FastAPI(
    title="CandidateV Authentication Service (Lifespan DB Test)", # Updated title
    description="Authentication service for the CandidateV application",
    version="1.0.0",
    lifespan=lifespan 
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
    db_status = "connected" if hasattr(app.state, 'db_engine') and app.state.db_engine else "disconnected"
    return {"message": "CandidateV Authentication Service (Lifespan DB Test)", "db_status": db_status}

# Add a minimal health check 
@app.get("/api/health") 
async def minimal_health_check():
    db_status = "connected" if hasattr(app.state, 'db_engine') and app.state.db_engine else "disconnected"
    return {"status": "healthy", "mode": "lifespan-db-test", "db_status": db_status}

# Keep the root health check just in case
@app.get("/health")
async def root_health_check():
    db_status = "connected" if hasattr(app.state, 'db_engine') and app.state.db_engine else "disconnected"
    return {"status": "healthy", "mode": "lifespan-db-test-root", "db_status": db_status} 

# --- Remove old startup/shutdown events --- 
# @app.on_event("startup") ... # REMOVED
# @app.on_event("shutdown") ... # REMOVED 