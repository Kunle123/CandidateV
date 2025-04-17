"""
User Service Module - Provides user profile management capabilities
"""
from fastapi import FastAPI

# Create the FastAPI application
app = FastAPI(
    title="CandidateV User Service",
    description="User management service for the CandidateV application",
    version="1.0.0",
)

# Import routers after creating app to avoid circular imports
from .health import router as health_router
from .users import router as users_router

# Include routers
app.include_router(health_router)
app.include_router(users_router) 