import os
import sys
import logging
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("user_service")

# Create uploads directory if it doesn't exist
uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8001"))
    logger.info(f"Starting User Management Service on port {port}")
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True, app_dir=os.path.dirname(os.path.abspath(__file__))) 