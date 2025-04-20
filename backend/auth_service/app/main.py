from fastapi import FastAPI
import logging

# Basic logging config
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info("--- Starting Simplest Possible main.py ---")

try:
    app = FastAPI(title="Simplest Auth Test")
    logger.info("FastAPI app object created.")

    @app.get("/")
    async def root():
        logger.info("Root endpoint hit.")
        return {"message": "Simplest Auth Test OK"}

    @app.get("/api/health")
    async def health():
        logger.info("Health endpoint hit.")
        return {"status": "healthy"}
        
    logger.info("--- Routes defined for Simplest Possible main.py ---")

except Exception as e:
    logger.error(f"CRITICAL ERROR during simplest app setup: {e}", exc_info=True)
    # Ensure the error is visible
    print(f"CRITICAL ERROR during simplest app setup: {e}")
    import traceback
    traceback.print_exc()
    # Attempt to exit to prevent misleading health checks if possible
    import sys
    sys.exit(1) 