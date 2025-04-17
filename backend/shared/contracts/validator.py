import json
import os
import jsonschema
from jsonschema import validate
from typing import Any, Dict, Optional

# Load contract schemas
CONTRACTS_DIR = os.path.dirname(os.path.abspath(__file__))

def load_schema(service_name: str) -> Dict[str, Any]:
    """Load a service's contract schema from file."""
    schema_path = os.path.join(CONTRACTS_DIR, f"{service_name}.json")
    try:
        with open(schema_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        raise ValueError(f"Schema file not found for service: {service_name}")
    except json.JSONDecodeError:
        raise ValueError(f"Invalid JSON in schema file for service: {service_name}")

class ContractValidator:
    """Validate requests and responses against API contracts."""
    
    def __init__(self, service_name: str):
        """Initialize validator with service schema."""
        self.schema = load_schema(service_name)
        self.service_name = service_name
    
    def validate_request(self, path: str, method: str, data: Dict[str, Any]) -> Optional[str]:
        """Validate a request against the contract.
        
        Args:
            path: API endpoint path (e.g., "/api/auth/login")
            method: HTTP method (e.g., "post")
            data: Request data
            
        Returns:
            Error message if validation fails, None otherwise
        """
        try:
            # Get path schema
            if path not in self.schema.get("paths", {}):
                return f"Path {path} not found in contract schema"
            
            path_schema = self.schema["paths"][path]
            
            # Get method schema
            if method.lower() not in path_schema:
                return f"Method {method} not defined for path {path} in contract schema"
            
            method_schema = path_schema[method.lower()]
            
            # Get request body schema
            if "requestBody" not in method_schema:
                # If no request body is expected, that's fine for empty data
                if not data:
                    return None
                return f"No request body expected for {method} {path}, but data was provided"
            
            request_schema = method_schema["requestBody"]
            
            # If requestBody has a content property, it's a file upload
            if isinstance(request_schema, dict) and "content" in request_schema:
                # Special handling for file uploads
                # This is simplified; in reality you'd need to check multipart form data
                return None
            
            # Get schema definition
            if "$ref" in request_schema:
                ref = request_schema["$ref"]
                if ref.startswith("#/definitions/"):
                    definition_name = ref.split("/")[-1]
                    if definition_name not in self.schema.get("definitions", {}):
                        return f"Definition {definition_name} not found in contract schema"
                    
                    definition = self.schema["definitions"][definition_name]
                    
                    # Create a resolver for nested schema references
                    resolver = jsonschema.RefResolver.from_schema(self.schema)
                    validate(instance=data, schema=definition, resolver=resolver)
                else:
                    return f"Invalid schema reference: {ref}"
            else:
                # Direct schema
                # Create a resolver for nested schema references
                resolver = jsonschema.RefResolver.from_schema(self.schema)
                validate(instance=data, schema=request_schema, resolver=resolver)
            
            return None
            
        except jsonschema.exceptions.ValidationError as e:
            return f"Request validation error: {e.message}"
    
    def validate_response(self, path: str, method: str, status_code: int, data: Dict[str, Any]) -> Optional[str]:
        """Validate a response against the contract.
        
        Args:
            path: API endpoint path (e.g., "/api/auth/login")
            method: HTTP method (e.g., "post")
            status_code: HTTP status code
            data: Response data
            
        Returns:
            Error message if validation fails, None otherwise
        """
        try:
            # Get path schema
            if path not in self.schema.get("paths", {}):
                return f"Path {path} not found in contract schema"
            
            path_schema = self.schema["paths"][path]
            
            # Get method schema
            if method.lower() not in path_schema:
                return f"Method {method} not defined for path {path} in contract schema"
            
            method_schema = path_schema[method.lower()]
            
            # Get response schema
            if "responses" not in method_schema:
                return f"No responses defined for {method} {path} in contract schema"
            
            responses = method_schema["responses"]
            
            # Check status code
            status_str = str(status_code)
            if status_str not in responses:
                return f"Status code {status_code} not defined for {method} {path} in contract schema"
            
            response_schema = responses[status_str]
            
            # Get schema definition
            if "$ref" in response_schema:
                ref = response_schema["$ref"]
                if ref.startswith("#/definitions/"):
                    definition_name = ref.split("/")[-1]
                    if definition_name not in self.schema.get("definitions", {}):
                        return f"Definition {definition_name} not found in contract schema"
                    
                    definition = self.schema["definitions"][definition_name]
                    validate(instance=data, schema=definition)
                else:
                    return f"Invalid schema reference: {ref}"
            else:
                # Direct schema
                validate(instance=data, schema=response_schema)
            
            return None
            
        except jsonschema.exceptions.ValidationError as e:
            return f"Response validation error: {e.message}" 