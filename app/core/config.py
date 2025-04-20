"""
Core configuration module that exports settings for the application.
"""
from functools import lru_cache
from typing import Any, Dict, List, Optional, Union
from pydantic import AnyHttpUrl, EmailStr, validator
from pydantic_settings import BaseSettings

from config.loader import ConfigurationLoader

class Settings(BaseSettings):
    # Load configuration from our new system
    _config: Dict[str, Any] = ConfigurationLoader.load_config()
    
    # Project Info
    PROJECT_NAME: str = _config["PROJECT_NAME"]
    VERSION: str = _config["VERSION"]
    API_V1_STR: str = _config["API_V1_STR"]
    
    # Environment
    ENVIRONMENT: str = _config.get("ENVIRONMENT", "development")
    DEBUG: bool = ENVIRONMENT == "development"
    
    # Security
    SECRET_KEY: str = _config["SECRET_KEY"]
    ACCESS_TOKEN_EXPIRE_MINUTES: int = _config["ACCESS_TOKEN_EXPIRE_MINUTES"]
    REFRESH_TOKEN_EXPIRE_DAYS: int = _config["REFRESH_TOKEN_EXPIRE_DAYS"]
    ALGORITHM: str = _config["ALGORITHM"]
    
    # Database
    POSTGRES_SERVER: str = _config["POSTGRES_SERVER"]
    POSTGRES_USER: str = _config["POSTGRES_USER"]
    POSTGRES_PASSWORD: str = _config["POSTGRES_PASSWORD"]
    POSTGRES_DB: str = _config["POSTGRES_DB"]
    DATABASE_URL: Optional[str] = _config.get("DATABASE_URL")
    SQLALCHEMY_DATABASE_URI: Optional[str] = DATABASE_URL

    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = _config["BACKEND_CORS_ORIGINS"]
    
    # Email
    SMTP_TLS: bool = _config.get("SMTP_TLS", True)
    SMTP_PORT: Optional[int] = _config.get("SMTP_PORT")
    SMTP_HOST: Optional[str] = _config.get("SMTP_HOST")
    SMTP_USER: Optional[str] = _config.get("SMTP_USER")
    SMTP_PASSWORD: Optional[str] = _config.get("SMTP_PASSWORD")
    EMAILS_FROM_EMAIL: Optional[EmailStr] = _config.get("EMAILS_FROM_EMAIL")
    EMAILS_FROM_NAME: Optional[str] = _config.get("EMAILS_FROM_NAME")

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = _config["RATE_LIMIT_PER_MINUTE"]

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    class Config:
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings() 