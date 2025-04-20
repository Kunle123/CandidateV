from pydantic_settings import BaseSettings
from pydantic import Field
import os

class Settings(BaseSettings):
    DATABASE_URL: str = Field(..., validation_alias='DATABASE_URL')
    REDIS_URL: str | None = Field(default=None, validation_alias='REDIS_URL')
    JWT_SECRET: str = Field(..., validation_alias='JWT_SECRET')
    JWT_ALGORITHM: str = Field(default="HS256", validation_alias='JWT_ALGORITHM')
    JWT_EXPIRATION_MINUTES: int = Field(default=30, validation_alias='JWT_EXPIRATION') # Match old name
    
    CORS_ORIGINS_STRING: str = Field(
        default="https://candidate-v.vercel.app,http://localhost:3000,http://localhost:5173", 
        validation_alias='CORS_ORIGINS' # Read from CORS_ORIGINS env var
    )

    # Allow loading from .env file if present (useful for local dev)
    # Requires python-dotenv to be installed
    # class Config:
    #     env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env') # Adjust path as needed
    #     env_file_encoding = 'utf-8'
    #     extra = 'ignore' # Ignore extra env vars

    @property
    def CORS_ORIGINS(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS_STRING.split(",") if origin.strip()]

# Create a single settings instance
settings = Settings() 