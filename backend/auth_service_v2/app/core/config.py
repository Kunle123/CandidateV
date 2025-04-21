"""Configuration settings."""
import os
from typing import Any, Dict, List, Optional, Union
from pydantic import AnyHttpUrl, EmailStr, PostgresDsn, validator
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    """Application settings."""
    # Project Info
    PROJECT_NAME: str = "CandidateV Authentication Service"
    VERSION: str = "2.0.0"
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-for-jwt")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    PASSWORD_RESET_TOKEN_EXPIRE_HOURS: int = 24
    EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS: int = 48
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: Union[str, List[str]] = os.getenv("BACKEND_CORS_ORIGINS", "*")

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        """Validate CORS origins."""
        if isinstance(v, str):
            if v == "*":
                return ["*"]
            return [i.strip() for i in v.split(",")]
        return v

    # Database Configuration
    POSTGRES_SCHEME: str = "postgresql+asyncpg"  # Default async scheme
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "candidatev")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    
    # The complete Database URL (optional, will be constructed if not provided)
    DATABASE_URL: Optional[str] = None

    # SQLAlchemy Database URI (will be set by validator)
    SQLALCHEMY_DATABASE_URI: Optional[str] = None

    @validator("DATABASE_URL", pre=True)
    def convert_database_url(cls, v: Optional[str]) -> Optional[str]:
        """Convert DATABASE_URL to async format if needed."""
        if not v:
            return v
        # Keep the URL as is - we'll handle async conversion in SQLALCHEMY_DATABASE_URI
        return v

    @validator("SQLALCHEMY_DATABASE_URI", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
        """Assemble database connection string."""
        if isinstance(v, str):
            return v
        
        # First check if complete DATABASE_URL is provided
        db_url = values.get("DATABASE_URL")
        if db_url:
            # For migrations, use regular postgresql scheme
            if os.getenv("USE_SYNC_DRIVER", "").lower() == "true":
                return db_url.replace("postgresql+asyncpg://", "postgresql://")
            # For runtime, use asyncpg
            return db_url.replace("postgresql://", "postgresql+asyncpg://").replace("postgres://", "postgresql+asyncpg://")
            
        # Otherwise construct from components
        try:
            scheme = "postgresql" if os.getenv("USE_SYNC_DRIVER", "").lower() == "true" else values.get('POSTGRES_SCHEME')
            return f"{scheme}://{values.get('POSTGRES_USER')}:{values.get('POSTGRES_PASSWORD')}@{values.get('POSTGRES_SERVER')}:{values.get('POSTGRES_PORT')}/{values.get('POSTGRES_DB')}"
        except Exception as e:
            print(f"Error constructing database URL: {e}")
            return None

    # Email Configuration
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", "")
    MAIL_FROM: str = os.getenv("MAIL_FROM", "noreply@candidatev.com")
    EMAILS_FROM_EMAIL: EmailStr = os.getenv("EMAILS_FROM_EMAIL", "noreply@candidatev.com")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", "587"))
    MAIL_SERVER: str = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_FROM_NAME: str = os.getenv("MAIL_FROM_NAME", "CandidateV")
    MAIL_TLS: bool = os.getenv("MAIL_TLS", "true").lower() == "true"
    MAIL_SSL: bool = os.getenv("MAIL_SSL", "false").lower() == "true"
    USE_CREDENTIALS: bool = os.getenv("USE_CREDENTIALS", "true").lower() == "true"

    @validator("EMAILS_FROM_EMAIL", pre=True)
    def use_mail_from_if_no_emails_from(cls, v: str, values: Dict[str, Any]) -> str:
        """Use MAIL_FROM if EMAILS_FROM_EMAIL is not set."""
        if not v and values.get("MAIL_FROM"):
            return values["MAIL_FROM"]
        return v

    # For backward compatibility
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Use SMTP settings if MAIL settings are not provided
        if not self.MAIL_USERNAME and self.SMTP_USER:
            self.MAIL_USERNAME = self.SMTP_USER
        if not self.MAIL_PASSWORD and self.SMTP_PASSWORD:
            self.MAIL_PASSWORD = self.SMTP_PASSWORD

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))

    class Config:
        """Pydantic configuration."""
        case_sensitive = True
        env_file = ".env"
        extra = "allow"  # Allow extra fields from environment variables

# Create settings instance
settings = Settings()

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return settings 