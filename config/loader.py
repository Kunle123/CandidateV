"""
Configuration loader that combines settings from files and environment variables.
"""
import os
from typing import Type, Dict, Any
from functools import lru_cache

from .base import BaseConfig
from .environments.development import DevelopmentConfig
from .environments.production import ProductionConfig

class MissingEnvironmentVariable(Exception):
    """Raised when a required environment variable is missing."""
    pass

class ConfigurationLoader:
    """Loads and manages application configuration."""
    
    ENV_CONFIGS = {
        "development": DevelopmentConfig,
        "production": ProductionConfig,
    }
    
    REQUIRED_ENV_VARS = [
        "POSTGRES_USER",
        "POSTGRES_PASSWORD",
        "SECRET_KEY",
    ]
    
    OPTIONAL_ENV_VARS = [
        "POSTGRES_SERVER",
        "POSTGRES_PORT",
        "SMTP_HOST",
        "SMTP_USER",
        "SMTP_PASSWORD",
        "EMAILS_FROM_EMAIL",
    ]
    
    @classmethod
    def load_from_env(cls) -> Dict[str, Any]:
        """Load sensitive configuration from environment variables."""
        # Check required environment variables
        missing_vars = [
            var for var in cls.REQUIRED_ENV_VARS 
            if not os.getenv(var)
        ]
        if missing_vars:
            raise MissingEnvironmentVariable(
                f"Missing required environment variables: {', '.join(missing_vars)}"
            )
        
        # Load environment variables
        env_config = {}
        for var in cls.REQUIRED_ENV_VARS + cls.OPTIONAL_ENV_VARS:
            if value := os.getenv(var):
                env_config[var] = value
        
        return env_config
    
    @classmethod
    def get_config_class(cls) -> Type[BaseConfig]:
        """Get the appropriate configuration class based on environment."""
        env = os.getenv("ENVIRONMENT", "development").lower()
        return cls.ENV_CONFIGS.get(env, DevelopmentConfig)
    
    @classmethod
    @lru_cache()
    def load_config(cls) -> Dict[str, Any]:
        """Load and merge all configuration sources."""
        # Get base configuration from appropriate environment
        config_class = cls.get_config_class()
        config = config_class.get_settings()
        
        # Override with environment variables
        env_config = cls.load_from_env()
        config.update(env_config)
        
        # Special handling for database URL
        if all(config.get(key) for key in ["POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_SERVER"]):
            config["DATABASE_URL"] = (
                f"postgresql://{config['POSTGRES_USER']}:{config['POSTGRES_PASSWORD']}"
                f"@{config['POSTGRES_SERVER']}:{config.get('POSTGRES_PORT', 5432)}"
                f"/{config['POSTGRES_DB']}"
            )
        
        return config

# Global instance for easy access
config = ConfigurationLoader.load_config() 