"""
Fallback implementation of shared contracts functionality.
This is used when the main shared module is not available.
"""
from fastapi import FastAPI
import logging

logger = logging.getLogger("user_service")

def add_contract_validation(app: FastAPI, service_name: str, contract_version: str):
    """
    Fallback implementation for contract validation.
    
    This function is used when the real shared.contracts module is not available.
    It provides a no-op implementation that allows the application to run.
    
    Args:
        app: The FastAPI application
        service_name: Name of the service
        contract_version: Version of the contract
    """
    logger.warning(f"Using fallback contract validation for {service_name} v{contract_version}")
    # This is a no-op implementation
    return app

class ContractValidator:
    """
    Fallback implementation of ContractValidator.
    """
    def __init__(self, service_name: str):
        self.service_name = service_name
        logger.warning(f"Using fallback ContractValidator for {service_name}")
    
    def generate_openapi_schema(self):
        """
        Generate a basic OpenAPI schema as fallback.
        """
        logger.warning("Using fallback OpenAPI schema generation")
        return None 