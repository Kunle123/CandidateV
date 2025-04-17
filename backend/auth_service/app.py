"""
CandidateV Authentication Service
Main module that imports and exports the FastAPI app
"""
import logging
import sys

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("auth_service")

# Import the app from app.main
try:
    from app.main import app
    logger.info("Successfully imported app from app.main")
except ImportError as e:
    logger.error(f"Error importing app from app.main: {e}")
    # The exception will be raised after logging for better debugging
    raise

# This module exports only the app object
# In testing/development mode, run directly
if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    logger.info(f"Starting Authentication Service on port {port}")
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True) 