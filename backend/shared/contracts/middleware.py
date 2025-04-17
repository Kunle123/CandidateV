from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import json
import asyncio
from typing import Callable, Dict, Any, Optional
import logging

from .validator import ContractValidator

logger = logging.getLogger("contract.middleware")

class ContractValidationMiddleware(BaseHTTPMiddleware):
    """Middleware to validate requests and responses against API contracts."""
    
    def __init__(self, app: ASGIApp, service_name: str, contract_version: str = "1.0.0"):
        """Initialize the middleware.
        
        Args:
            app: The ASGI application
            service_name: Name of the service (used to load correct contract schema)
            contract_version: Version of the contract being implemented
        """
        super().__init__(app)
        self.validator = ContractValidator(service_name)
        self.service_name = service_name
        self.contract_version = contract_version
    
    async def set_body(self, request: Request):
        """Store the request body so it can be read multiple times."""
        receive_ = await request._receive()
        
        async def receive():
            return receive_
            
        request._receive = receive
    
    async def get_body_data(self, request: Request) -> Dict[str, Any]:
        """Get the request body data as JSON."""
        try:
            body = await request.body()
            if not body:
                return {}
                
            content_type = request.headers.get("content-type", "")
            
            if "application/json" in content_type:
                return json.loads(body)
            elif "multipart/form-data" in content_type:
                # For file uploads, we don't validate the body structure here
                # That's handled by the route function
                return {}
            else:
                return {}
        except json.JSONDecodeError:
            return {}
        except Exception as e:
            logger.error(f"Error reading request body: {str(e)}")
            return {}
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Validate request and response against contract schema."""
        
        # Store the original request body
        await self.set_body(request)
        
        path = request.url.path
        method = request.method
        
        # Skip validation for non-API paths or specific paths
        if not path.startswith("/api") or path == "/api/health":
            return await call_next(request)
        
        # Validate request body
        body_data = await self.get_body_data(request)
        
        request_error = self.validator.validate_request(path, method, body_data)
        if request_error:
            logger.warning(f"Contract validation failed for request {method} {path}: {request_error}")
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "message": "The request does not match the API contract",
                    "detail": request_error
                }
            )
        
        # Process the request
        response = await call_next(request)
        
        # Add contract version header
        response.headers["X-Contract-Version"] = self.contract_version
        
        # Skip validation for specific status codes
        if response.status_code in (204, 304):
            return response
        
        # Skip validation for non-JSON responses
        content_type = response.headers.get("content-type", "")
        if not content_type or "application/json" not in content_type:
            return response
        
        # Validate response body
        try:
            # Create a copy of the response to read the body
            response_body = b""
            async for chunk in response.body_iterator:
                response_body += chunk
                
            # Recreate the response
            response = Response(
                content=response_body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type
            )
            
            # Parse response data
            response_data = json.loads(response_body)
            
            # Validate response
            response_error = self.validator.validate_response(path, method, response.status_code, response_data)
            if response_error:
                logger.error(f"Contract validation failed for response {method} {path} {response.status_code}: {response_error}")
                # Log error but don't change the response to avoid user impact
                # In a testing environment, you might want to raise an exception here
        except Exception as e:
            logger.error(f"Error validating response: {str(e)}")
        
        return response

def add_contract_validation(app: FastAPI, service_name: str, contract_version: str = "1.0.0"):
    """Add contract validation middleware to a FastAPI app."""
    app.add_middleware(
        ContractValidationMiddleware, 
        service_name=service_name, 
        contract_version=contract_version
    ) 