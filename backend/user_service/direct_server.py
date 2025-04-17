import os
import sys
import uvicorn
import logging

# Add the current directory to PATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("user_service")

# Directly import the app from the app.py file
try:
    # This should directly pull in the app variable from app.py
    from app import app
    logger.info("Successfully imported app from app.py")
except Exception as e:
    logger.error(f"Failed to import app: {str(e)}")
    raise

# Create uploads directory if it doesn't exist
uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8001"))
    logger.info(f"Starting User Management Service on port {port}")
    
    # Since we've already imported the app, run it directly
    uvicorn.run(app, host="0.0.0.0", port=port) 