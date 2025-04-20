"""Contract tests for validating API responses against OpenAPI schema."""
import json
import pytest
from fastapi.testclient import TestClient
from jsonschema import validate, ValidationError

from app.core.config import settings
from app.services.user import create_user
from app.core.security import get_password_hash
from tests.utils.user import authentication_token_from_email

def load_schema():
    """Load the OpenAPI schema from the auth service contract."""
    with open("../shared/contracts/auth_service.json") as f:
        return json.load(f)

@pytest.fixture(scope="module")
def api_schema():
    """Fixture to load API schema once for all tests."""
    return load_schema()

def test_register_response_schema(client: TestClient, api_schema):
    """Test that register endpoint response matches the contract schema."""
    user_data = {
        "email": "test.contract@example.com",
        "password": "testpassword123",
        "name": "Test Contract User"
    }
    
    response = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json=user_data
    )
    assert response.status_code == 201
    
    # Validate response against schema
    schema = api_schema["definitions"]["UserResponse"]
    try:
        validate(instance=response.json(), schema=schema)
    except ValidationError as e:
        pytest.fail(f"Response does not match schema: {str(e)}")

def test_login_response_schema(client: TestClient, api_schema, test_user):
    """Test that login endpoint response matches the contract schema."""
    # Create user first
    test_user["password"] = get_password_hash(test_user["password"])
    create_user(next(client.app.state.get_db()), test_user)
    
    login_data = {
        "username": test_user["email"],
        "password": test_user["password"]
    }
    
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data=login_data
    )
    assert response.status_code == 200
    
    # Validate response against schema
    schema = api_schema["definitions"]["TokenResponse"]
    try:
        validate(instance=response.json(), schema=schema)
    except ValidationError as e:
        pytest.fail(f"Response does not match schema: {str(e)}")

def test_password_reset_request_schema(client: TestClient, api_schema):
    """Test that password reset request response matches the contract schema."""
    response = client.post(
        f"{settings.API_V1_STR}/auth/password-reset/request",
        json={"email": "test.reset@example.com"}
    )
    assert response.status_code == 200
    
    # Validate response against schema
    schema = api_schema["definitions"]["MessageResponse"]
    try:
        validate(instance=response.json(), schema=schema)
    except ValidationError as e:
        pytest.fail(f"Response does not match schema: {str(e)}")

def test_error_response_schema(client: TestClient, api_schema):
    """Test that error responses match the contract schema."""
    # Test with invalid login
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": "nonexistent@example.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401
    
    # Validate error response against schema
    schema = api_schema["definitions"]["ErrorResponse"]
    try:
        validate(instance=response.json(), schema=schema)
    except ValidationError as e:
        pytest.fail(f"Error response does not match schema: {str(e)}")

def test_health_check_schema(client: TestClient, api_schema):
    """Test that health check response matches the contract schema."""
    response = client.get(f"{settings.API_V1_STR}/health")
    assert response.status_code == 200
    
    # Validate response against schema
    schema = api_schema["definitions"]["HealthResponse"]
    try:
        validate(instance=response.json(), schema=schema)
    except ValidationError as e:
        pytest.fail(f"Response does not match schema: {str(e)}") 