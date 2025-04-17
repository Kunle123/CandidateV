"""
Run script for User Management Service that handles environment setup
This script configures the environment and runs the service using uvicorn.
"""
import os
import sys
import uvicorn
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("run_script")

def set_environment_variables():
    """Set all required environment variables."""
    # Database URL
    os.environ["DATABASE_URL"] = "sqlite:///./user_service.db"
    logger.info(f"Set DATABASE_URL = {os.environ['DATABASE_URL']}")
    
    # Core settings
    os.environ["PORT"] = "8085"  # Use different port to avoid conflicts
    os.environ["JWT_SECRET"] = "your-secret-key-here-for-development-only"
    os.environ["JWT_ALGORITHM"] = "HS256"
    os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"
    os.environ["BASE_URL"] = "http://localhost:8085"
    
    # CORS settings
    os.environ["CORS_ORIGINS"] = "http://localhost:3000,http://localhost:5173,https://candidatev.vercel.app"
    
    # Storage settings
    os.environ["USE_LOCAL_STORAGE"] = "true"
    os.environ["LOCAL_STORAGE_PATH"] = "./uploads"
    
    # Create uploads directory if it doesn't exist
    if not os.path.exists("./uploads"):
        os.makedirs("./uploads")
        logger.info("Created uploads directory")

def run_service():
    """Start the service using uvicorn."""
    logger.info("Starting User Management Service...")
    port = int(os.environ.get("PORT", 8085))
    
    # Use absolute import path for the app
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    try:
        # Setup environment
        set_environment_variables()
        
        # Check if the database file exists
        if not os.path.exists("user_service.db"):
            logger.warning("Database file not found. Please run direct_setup_db.py first.")
            sys.exit(1)
            
        # Run the service
        run_service()
    except Exception as e:
        logger.error(f"Error running service: {str(e)}")
        sys.exit(1) 