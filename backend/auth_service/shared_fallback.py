"""
Fallback implementation of shared contracts functionality.
This is used when the main shared module is not available.
"""
from fastapi import FastAPI
import logging

logger = logging.getLogger("auth_service")

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