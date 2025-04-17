from pydantic import BaseModel
import os
from typing import List, Dict, Any

class LogConfig(BaseModel):
    """Logging configuration"""
    LOGGER_NAME: str = "payment_service"
    LOG_FORMAT: str = "%(levelprefix)s %(asctime)s - %(name)s - %(message)s"
    LOG_LEVEL: str = "INFO"

    # Options: ["console", "file", "both"]
    LOG_OUTPUT: str = os.getenv("LOG_OUTPUT", "console")
    LOG_FILE: str = "logs/payment_service.log"

    # Dict config for logging
    version: int = 1
    disable_existing_loggers: bool = False
    formatters: Dict[str, Any] = {
        "default": {
            "()": "uvicorn.logging.DefaultFormatter",
            "fmt": LOG_FORMAT,
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    }
    handlers: Dict[str, Any] = {
        "default": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stderr",
        },
    }
    loggers: Dict[str, Any] = {
        LOGGER_NAME: {"handlers": ["default"], "level": LOG_LEVEL},
    }

    def dict(self, *args, **kwargs):
        if self.LOG_OUTPUT == "file" or self.LOG_OUTPUT == "both":
            self.handlers["file"] = {
                "formatter": "default",
                "class": "logging.FileHandler",
                "filename": self.LOG_FILE,
            }
            self.loggers[self.LOGGER_NAME]["handlers"].append("file")
        
        return super().dict(*args, **kwargs)

class Settings(BaseModel):
    """Application settings"""
    APP_NAME: str = "CandidateV Payment Service"
    APP_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Auth settings
    JWT_SECRET: str = os.getenv("JWT_SECRET", "your-secret-key-here")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    
    # Stripe settings
    STRIPE_API_KEY: str = os.getenv("STRIPE_API_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    
    # Pricing
    BASIC_PLAN_PRICE_ID: str = os.getenv("BASIC_PLAN_PRICE_ID", "price_basic")
    PRO_PLAN_PRICE_ID: str = os.getenv("PRO_PLAN_PRICE_ID", "price_pro")
    ENTERPRISE_PLAN_PRICE_ID: str = os.getenv("ENTERPRISE_PLAN_PRICE_ID", "price_enterprise")
    
    # Service URLs
    AUTH_SERVICE_URL: str = os.getenv("AUTH_SERVICE_URL", "http://localhost:8000")
    CV_SERVICE_URL: str = os.getenv("CV_SERVICE_URL", "http://localhost:8002")

# Initialize settings
settings = Settings() 