"""
Simple test script to verify deployed services.
Usage: python test_deployment.py
"""

import os
import requests
import json
from datetime import datetime

# Get service URLs from environment variables
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "https://auth-2-production.up.railway.app")

def test_health_endpoint():
    """Test health endpoint for auth service."""
    print("\n===== Testing Health Endpoint =====")
    
    # Test Auth Service health
    try:
        response = requests.get(f"{AUTH_SERVICE_URL}/api/v1/health")
        print(f"Auth Service Health: {response.status_code}")
        if response.status_code == 200:
            print(f"Auth Service Response: {json.dumps(response.json(), indent=2)}")
            print("✅ Auth Service health check passed")
        else:
            print(f"❌ Auth Service returned {response.status_code}")
    except Exception as e:
        print(f"❌ Auth Service health check failed: {str(e)}")

def test_auth_service_endpoints():
    """Test basic endpoints on the Auth Service."""
    print("\n===== Testing Auth Service Endpoints =====")
    
    # Test root endpoint
    try:
        response = requests.get(f"{AUTH_SERVICE_URL}/api/v1")
        print(f"Root Endpoint: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            print("✅ Root endpoint check passed")
        else:
            print(f"❌ Root endpoint returned {response.status_code}")
    except Exception as e:
        print(f"❌ Root endpoint check failed: {str(e)}")
    
    # Test registration with a dummy user
    test_email = f"test_{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com"
    register_data = {
        "email": test_email,
        "password": "Test1234!",
        "full_name": "Test User"
    }
    
    try:
        response = requests.post(
            f"{AUTH_SERVICE_URL}/api/v1/auth/register",
            json=register_data
        )
        print(f"Register Endpoint: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2) if response.status_code < 300 else response.text}")
        if response.status_code == 201:
            print("✅ Register endpoint check passed")
        else:
            print(f"⚠️ Register endpoint returned {response.status_code} - May be expected if using mock data")
    except Exception as e:
        print(f"❌ Register endpoint check failed: {str(e)}")

def test_cors_configuration():
    """Test CORS configuration by sending requests with Origin header."""
    print("\n===== Testing CORS Configuration =====")
    
    headers = {"Origin": "https://auth-2-production.up.railway.app"}
    
    # Test Auth Service CORS
    try:
        response = requests.get(f"{AUTH_SERVICE_URL}/api/v1/health", headers=headers)
        cors_header = response.headers.get("Access-Control-Allow-Origin")
        print(f"Auth Service CORS Header: {cors_header}")
        if cors_header:
            print("✅ Auth Service CORS check passed")
        else:
            print("❌ Auth Service CORS header missing")
    except Exception as e:
        print(f"❌ Auth Service CORS check failed: {str(e)}")

if __name__ == "__main__":
    print(f"Testing deployed service at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Auth Service URL: {AUTH_SERVICE_URL}")
    
    test_health_endpoint()
    test_auth_service_endpoints()
    test_cors_configuration()
    
    print("\n===== Test Summary =====")
    print("This was a basic connectivity test.")
    print("Some tests may have failed if authentication is required or if using mock data.")
    print("Update the script with valid credentials for more thorough testing.") 