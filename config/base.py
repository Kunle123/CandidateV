"""
Base configuration for the auth service.
This file contains non-sensitive configuration that can be version controlled.
"""
from typing import Dict, Any

class BaseConfig:
    # Project Info
    PROJECT_NAME: str = "CandidateV Authentication Service"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"
    
    # CORS Settings
    BACKEND_CORS_ORIGINS: list = [
        "http://localhost:3000",  # React default port
        "http://localhost:8000",  # API default port
    ]
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Database Settings (non-sensitive)
    POSTGRES_DB: str = "candidatev"
    POSTGRES_SERVER: str = "localhost"  # Will be overridden by environment
    POSTGRES_PORT: int = 5432
    
    # Email Settings (non-sensitive)
    SMTP_TLS: bool = True
    SMTP_PORT: int = 587
    EMAILS_FROM_NAME: str = "CandidateV Support"
    
    @classmethod
    def get_settings(cls) -> Dict[str, Any]:
        """Get all settings as a dictionary."""
        return {
            key: value for key, value in cls.__dict__.items() 
            if not key.startswith('_')
        } 