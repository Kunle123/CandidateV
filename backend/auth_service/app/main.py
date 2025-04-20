from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
import time
import uuid
from .auth import router as auth_router
from .health import router as health_router
from .middleware import setup_rate_limiter
from .database import create_db_engine, close_db_engine, Base
from contextlib import asynccontextmanager
from .config import settings

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
        engine_instance = create_db_engine(settings.DATABASE_URL)
        app.state.db_engine = engine_instance
        logger.info("Lifespan: Database engine created. Attempting table creation...")
        Base.metadata.create_all(bind=engine_instance)
        logger.info("Lifespan: Database tables checked/created.")
    except Exception as e:
        logger.critical(f"Lifespan: CRITICAL ERROR during database initialization: {e}", exc_info=True)
        app.state.db_engine = None 
        raise

    try:
        logger.info("Lifespan: Initializing rate limiter...")
        await setup_rate_limiter()
        logger.info("Lifespan: Rate limiter setup complete (if enabled).")
    except Exception as e:
         logger.error(f"Lifespan: Error during rate limiter setup: {e}", exc_info=True)

    logger.info("Lifespan: Startup complete. Yielding control.")
    yield 
    
    # Shutdown
    logger.info("Lifespan: Shutdown phase beginning...")
    if hasattr(app.state, 'db_engine') and app.state.db_engine:
        logger.info("Lifespan: Closing database engine pool...")
        close_db_engine(app.state.db_engine)
    logger.info("Lifespan: Shutdown complete.")

# --- Create FastAPI App --- 
app = FastAPI(
    title="CandidateV Authentication Service",
    description="Authentication service for the CandidateV application",
    version="1.0.0",
    lifespan=lifespan 
)

# --- Middleware --- 
logger.info(f"Configuring CORS for origins: {settings.CORS_ORIGINS}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"]
)

# Request ID & Logging Middleware
@app.middleware("http")
async def add_request_id_and_log(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    start_time = time.time()
    logger.debug(f"Request started: {request.method} {request.url.path} (ID: {request_id})")
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Request-ID"] = request_id
        logger.info(f"Request completed: {request.method} {request.url.path} "
                    f"(ID: {request_id}) - Status: {response.status_code} - Time: {process_time:.3f}s")
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"Request failed: {request.method} {request.url.path} "
                     f"(ID: {request_id}) - Error: {e} - Time: {process_time:.3f}s", exc_info=True)
        raise e

# --- Routers --- 
logger.info("Including routers...")
app.include_router(auth_router)
app.include_router(health_router)
logger.info("Routers included.")

# --- Basic Endpoints (Remove temp ones) --- 
@app.get("/")
async def root():
    return {"message": "CandidateV Authentication Service"} 