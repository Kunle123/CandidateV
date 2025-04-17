# API Contract Validation System

This package provides a system for validating API requests and responses against JSON Schema contracts, ensuring that all services adhere to their defined interfaces.

## Features

- JSON Schema-based contract definitions
- Request and response validation
- FastAPI middleware for automatic validation
- Contract version tracking

## Usage

### 1. Define your service contract

Create a JSON Schema file for your service in the `contracts` directory, following this naming convention:

```
your_service_name.json
```

Example: `auth_service.json`

The contract should define:
- Data models (under `"definitions"`)
- Endpoints (under `"paths"`)
- Request/response formats

### 2. Add validation to your FastAPI app

```python
from fastapi import FastAPI
from shared.contracts import add_contract_validation

app = FastAPI()

# Add validation middleware
add_contract_validation(app, service_name="your_service_name", contract_version="1.0.0")
```

### 3. The middleware will:

- Validate all incoming requests against the contract
- Return a 400 error if a request doesn't match the contract
- Add an `X-Contract-Version` header to all responses
- Log warnings for responses that don't match the contract

## Testing Contract Compliance

You can also use the validator directly for testing:

```python
from shared.contracts import ContractValidator

validator = ContractValidator("your_service_name")

# Validate a request
error = validator.validate_request(
    path="/api/your-endpoint", 
    method="post", 
    data={"field": "value"}
)
if error:
    print(f"Request validation error: {error}")

# Validate a response
error = validator.validate_response(
    path="/api/your-endpoint", 
    method="post", 
    status_code=200, 
    data={"field": "value"}
)
if error:
    print(f"Response validation error: {error}")
```

## API Contract Schema Format

The contract schema follows an extended JSON Schema format:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Service API Contracts",
  "description": "JSON Schema definitions for the Service API endpoints",
  "definitions": {
    "ModelName": {
      "type": "object",
      "required": ["field1", "field2"],
      "properties": {
        "field1": {
          "type": "string",
          "description": "Description of field1"
        },
        "field2": {
          "type": "integer",
          "description": "Description of field2"
        }
      }
    }
  },
  "paths": {
    "/api/endpoint": {
      "post": {
        "requestBody": { "$ref": "#/definitions/RequestModel" },
        "responses": {
          "200": { "$ref": "#/definitions/ResponseModel" },
          "400": { "$ref": "#/definitions/ErrorResponse" }
        }
      }
    }
  }
}
```

## Best Practices

1. **Never change existing contracts** - Create a new version instead
2. **Use descriptive field names and comments** in your contract schemas
3. **Test contract compliance** as part of your CI/CD pipeline
4. **Log and monitor contract validation failures** to detect integration issues early

## Implementation Status

The following components of the contract validation system have been implemented:

1. **Contract Schemas**:
   - Authentication Service contract (`auth_service.json`)
   - User Management Service contract (`user_service.json`)
   - CV Management Service contract (`cv_service.json`)

2. **Validation Utilities**:
   - Contract validator for request/response validation (`validator.py`)
   - FastAPI middleware for automatic validation (`middleware.py`)
   - Test suite for contract validation (`test_validator.py`)

3. **Service Documentation**:
   - OpenAPI integration for Authentication Service (`backend/auth_service/openapi.yaml`)
   - Developer portal for API documentation (`backend/dev_portal`)

### Next Steps

1. **Complete contract schemas for remaining services**:
   - Export Service
   - AI Optimization Service
   - Payment & Subscription Service

2. **Integrate validation with all services**:
   - Add contract validation middleware to User Management Service
   - Add contract validation middleware to CV Management Service
   - Implement OpenAPI for remaining services

3. **Expand test coverage**:
   - Create contract compliance tests for each service
   - Add automated contract validation to CI/CD pipeline 