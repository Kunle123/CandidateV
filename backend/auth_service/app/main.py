from fastapi import FastAPI, Request, Depends
# from fastapi.middleware.cors import CORSMiddleware # Keep? Maybe needed for healthcheck? Assume yes for now.
import logging
import os
import time
import uuid
# from .auth import router as auth_router # <-- Commented out
# from .health import router as health_router # <-- Commented out
# from .middleware import setup_rate_limiter # <-- Commented out
# from .database import Base, engine # <-- Already Commented out

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="CandidateV Authentication Service (Minimal Test)", # Modified title
    description="Authentication service for the CandidateV application",
    version="1.0.0",
)

# Configure CORS - Keep for now, might be needed for health check
# cors_origins = os.getenv("CORS_ORIGINS", "https://candidate-v.vercel.app,http://localhost:3000,http://localhost:5173").split(",")
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=cors_origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
#     expose_headers=["X-Request-ID"]
# )

# Add request ID and logging middleware
# @app.middleware("http") # <-- Commented out
# async def add_request_id_and_log(request: Request, call_next):
#     request_id = str(uuid.uuid4())
#     request.state.request_id = request_id
#     
#     start_time = time.time()
#     logger.info(f"Request started: {request.method} {request.url.path} (ID: {request_id})")
#     
#     response = await call_next(request)
#     
#     process_time = time.time() - start_time
#     logger.info(f"Request completed: {request.method} {request.url.path} "
#                 f"(ID: {request_id}) - Status: {response.status_code} - Time: {process_time:.3f}s")
#     
#     response.headers["X-Request-ID"] = request_id
#     return response

# Register routers
# app.include_router(auth_router) # <-- Commented out
# app.include_router(health_router) # <-- Commented out

# @app.on_event("startup") # <-- Commented out
# async def startup():
#     logger.info("Starting up Authentication Service (Minimal Test)") 
#     # await setup_rate_limiter() # <-- Commented out

# @app.on_event("shutdown") # <-- Commented out
# async def shutdown():
#     logger.info("Shutting down Authentication Service")

@app.get("/")
async def root():
    # Basic root endpoint must exist
    return {"message": "CandidateV Authentication Service (Minimal Test)"}

# Add a minimal health check if the router one is disabled
@app.get("/api/health") 
async def minimal_health_check():
    logger.info("Minimal health check endpoint hit.")
    return {"status": "healthy", "mode": "minimal"}

# Keep the root health check just in case
@app.get("/health")
async def root_health_check():
    logger.info("Root health check endpoint hit.")
    return {"status": "healthy", "mode": "minimal-root"} 