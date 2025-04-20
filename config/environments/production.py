"""
Production environment configuration.
This file contains production-specific settings that can be version controlled.
"""
from ..base import BaseConfig

class ProductionConfig(BaseConfig):
    # Environment
    ENVIRONMENT: str = "production"
    DEBUG: bool = False
    
    # Security - stricter settings for production
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # Shorter token lifetime
    
    # Rate limiting - stricter in production
    RATE_LIMIT_PER_MINUTE: int = 30
    
    # CORS - more restrictive in production
    # These will be overridden by environment variables
    BACKEND_CORS_ORIGINS: list = [] 