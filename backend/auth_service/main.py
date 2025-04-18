import os
import logging
import sys
import uvicorn
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
import yaml

# Import app from the right location
from app import app

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("auth_service")

# Add contract validation if shared module is available
try:
    from shared.contracts import add_contract_validation
    logger.info("Using shared contract validation module")
except ImportError:
    logger.warning("Shared contracts module not found, using fallback implementation")
    from shared_fallback import add_contract_validation

# Apply contract validation
add_contract_validation(app, service_name="auth_service", contract_version="1.0.0")

# Load OpenAPI spec from file
@app.on_event("startup")
async def startup_event():
    try:
        # Load custom OpenAPI spec from YAML file
        with open(os.path.join(os.path.dirname(__file__), "openapi.yaml")) as f:
            openapi_schema = yaml.safe_load(f)
            app.openapi_schema = openapi_schema
            logger.info("Loaded OpenAPI schema from file")
    except Exception as e:
        logger.error(f"Error loading OpenAPI schema: {str(e)}")

# Replace FastAPI's default OpenAPI with our custom one
def custom_openapi():
    return app.openapi_schema

app.openapi = custom_openapi

# Serve OpenAPI UI
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title=f"{app.title} - Swagger UI",
        oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
    )

@app.get("/redoc", include_in_schema=False)
async def redoc_html():
    return get_redoc_html(
        openapi_url="/openapi.json",
        title=f"{app.title} - ReDoc",
    )

# Get OpenAPI schema
@app.get("/openapi.json", include_in_schema=False)
async def get_openapi_schema():
    return app.openapi_schema

if __name__ == "__main__":
    # Handle the PORT environment variable correctly
    port_str = os.getenv("PORT", "8000")
    try:
        port = int(port_str)
    except ValueError:
        logger.error(f"Invalid PORT environment variable value: '{port_str}', defaulting to 8000")
        port = 8000
    
    logger.info(f"Starting Authentication Service on port {port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True) 