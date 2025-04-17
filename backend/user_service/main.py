import os
import logging
import sys
import uvicorn
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
import yaml

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("user_service")

# Import app
from app import app

# Try to import contract validation if available
try:
    from shared.contracts import add_contract_validation
    # Add contract validation
    add_contract_validation(app, service_name="user_service", contract_version="1.0.0")
    logger.info("Contract validation added")
except ImportError:
    logger.warning("Contract validation not available - running without validation")

# Load OpenAPI spec from file (if available)
@app.on_event("startup")
async def startup_event():
    try:
        # Generate OpenAPI schema from contract
        from shared.contracts.validator import ContractValidator
        validator = ContractValidator("user_service")
        openapi_schema = validator.generate_openapi_schema()
        if openapi_schema:
            app.openapi_schema = openapi_schema
            logger.info("Generated OpenAPI schema from contract")
    except Exception as e:
        logger.error(f"Error generating OpenAPI schema: {str(e)}")

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
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=int(os.getenv("PORT", "8001")),
        reload=True
    ) 