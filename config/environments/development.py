"""
Development environment configuration.
This file contains development-specific settings that can be version controlled.
"""
from ..base import BaseConfig

class DevelopmentConfig(BaseConfig):
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Override database settings for development
    POSTGRES_SERVER: str = "localhost"
    
    # CORS - more permissive in development
    BACKEND_CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    ]
    
    # Rate limiting - more lenient in development
    RATE_LIMIT_PER_MINUTE: int = 120 