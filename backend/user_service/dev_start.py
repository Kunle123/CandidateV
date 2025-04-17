"""
Development starter script for User Management Service
This script:
1. Sets up environment variables
2. Creates the SQLite database if it doesn't exist
3. Runs the User Management Service
"""
import os
import sys
import logging
import sqlite3
import sqlalchemy
from sqlalchemy import Column, String, Text, JSON, DateTime
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base
import uuid
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("dev_start")

# Database constants
DB_FILE = "user_service.db"
DATABASE_URL = f"sqlite:///./{DB_FILE}"

def set_environment_variables():
    """Set all required environment variables."""
    os.environ["DATABASE_URL"] = DATABASE_URL
    logger.info(f"Set DATABASE_URL = {DATABASE_URL}")
    
    # Core settings
    os.environ["PORT"] = "8085"
    os.environ["JWT_SECRET"] = "your-secret-key-here-for-development-only"
    os.environ["JWT_ALGORITHM"] = "HS256"
    os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"
    os.environ["BASE_URL"] = f"http://localhost:{os.environ['PORT']}"
    
    # CORS settings
    os.environ["CORS_ORIGINS"] = "http://localhost:3000,http://localhost:5173,https://candidatev.vercel.app"
    
    # Storage settings
    os.environ["USE_LOCAL_STORAGE"] = "true"
    os.environ["LOCAL_STORAGE_PATH"] = "./uploads"

def setup_database():
    """Create the SQLite database if it doesn't exist."""
    if os.path.exists(DB_FILE):
        logger.info(f"Database file already exists: {DB_FILE}")
        return
    
    logger.info(f"Creating new database: {DB_FILE}")
    
    # Create database model
    Base = declarative_base()
    
    class UserProfile(Base):
        __tablename__ = "user_profiles"
        
        # Use String type for ID in SQLite (instead of UUID which is not supported)
        id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
        bio = Column(Text, nullable=True)
        profile_image_url = Column(String(255), nullable=True)
        job_title = Column(String(255), nullable=True)
        location = Column(String(255), nullable=True)
        website = Column(String(255), nullable=True)
        social_links = Column(JSON, nullable=True)
        preferences = Column(JSON, nullable=True)
        created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
        updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    
    # Create engine and tables
    engine = sqlalchemy.create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
    
    # Create tables
    Base.metadata.create_all(engine)
    logger.info("Database tables created")
    
    # Verify with direct SQLite access
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    logger.info("Tables created:")
    for table in tables:
        logger.info(f"- {table[0]}")
    
    conn.close()

def setup_directories():
    """Create necessary directories."""
    # Create uploads directory
    uploads_dir = os.environ.get("LOCAL_STORAGE_PATH", "./uploads")
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)
        logger.info(f"Created uploads directory: {uploads_dir}")

def run_service():
    """Run the User Management Service."""
    port = int(os.environ.get("PORT", 8085))
    logger.info(f"Starting User Management Service on port {port}")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    try:
        logger.info("Starting development environment for User Management Service")
        
        # Set environment variables
        set_environment_variables()
        
        # Setup directories
        setup_directories()
        
        # Setup database
        setup_database()
        
        # Run the service
        run_service()
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}")
        sys.exit(1) 