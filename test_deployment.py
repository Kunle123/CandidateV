"""
Simple test script to verify deployed services.
Usage: python test_deployment.py
"""

import requests
import json
from datetime import datetime

# Replace these with your actual deployed service URLs
AUTH_SERVICE_URL = "https://your-auth-service.railway.app"
USER_SERVICE_URL = "https://your-user-service.railway.app"

def test_health_endpoints():
    """Test health endpoints for both services."""
    print("\n===== Testing Health Endpoints =====")
    
    # Test Auth Service health
    try:
        response = requests.get(f"{AUTH_SERVICE_URL}/api/health")
        print(f"Auth Service Health: {response.status_code}")
        if response.status_code == 200:
            print(f"Auth Service Response: {json.dumps(response.json(), indent=2)}")
            print("✅ Auth Service health check passed")
        else:
            print(f"❌ Auth Service returned {response.status_code}")
    except Exception as e:
        print(f"❌ Auth Service health check failed: {str(e)}")
    
    # Test User Service health
    try:
        response = requests.get(f"{USER_SERVICE_URL}/api/health")
        print(f"User Service Health: {response.status_code}")
        if response.status_code == 200:
            print(f"User Service Response: {json.dumps(response.json(), indent=2)}")
            print("✅ User Service health check passed")
        else:
            print(f"❌ User Service returned {response.status_code}")
    except Exception as e:
        print(f"❌ User Service health check failed: {str(e)}")

def test_user_service_endpoints():
    """Test basic endpoints on the User Service."""
    print("\n===== Testing User Service Endpoints =====")
    
    # Test root endpoint
    try:
        response = requests.get(f"{USER_SERVICE_URL}/")
        print(f"Root Endpoint: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            print("✅ Root endpoint check passed")
        else:
            print(f"❌ Root endpoint returned {response.status_code}")
    except Exception as e:
        print(f"❌ Root endpoint check failed: {str(e)}")
    
    # This will likely fail without auth, but shows how to structure the request
    try:
        response = requests.get(
            f"{USER_SERVICE_URL}/api/users/me", 
            headers={"Authorization": "Bearer test_token"}
        )
        print(f"User Profile Endpoint: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            print("✅ User profile check passed")
        else:
            print(f"❌ User profile returned {response.status_code} - Expected if auth required")
    except Exception as e:
        print(f"❌ User profile check failed: {str(e)}")

def test_auth_service_endpoints():
    """Test basic endpoints on the Auth Service."""
    print("\n===== Testing Auth Service Endpoints =====")
    
    # Test root endpoint
    try:
        response = requests.get(f"{AUTH_SERVICE_URL}/")
        print(f"Root Endpoint: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            print("✅ Root endpoint check passed")
        else:
            print(f"❌ Root endpoint returned {response.status_code}")
    except Exception as e:
        print(f"❌ Root endpoint check failed: {str(e)}")
    
    # Test registration with a dummy user (this will succeed once, then fail on subsequent runs)
    test_email = f"test_{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com"
    register_data = {
        "email": test_email,
        "password": "Test1234!",
        "name": "Test User"
    }
    
    try:
        response = requests.post(
            f"{AUTH_SERVICE_URL}/api/auth/register",
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
    
    headers = {"Origin": "https://candidate-v.vercel.app"}
    
    # Test Auth Service CORS
    try:
        response = requests.get(f"{AUTH_SERVICE_URL}/api/health", headers=headers)
        cors_header = response.headers.get("Access-Control-Allow-Origin")
        print(f"Auth Service CORS Header: {cors_header}")
        if cors_header:
            print("✅ Auth Service CORS check passed")
        else:
            print("❌ Auth Service CORS header missing")
    except Exception as e:
        print(f"❌ Auth Service CORS check failed: {str(e)}")
    
    # Test User Service CORS
    try:
        response = requests.get(f"{USER_SERVICE_URL}/api/health", headers=headers)
        cors_header = response.headers.get("Access-Control-Allow-Origin")
        print(f"User Service CORS Header: {cors_header}")
        if cors_header:
            print("✅ User Service CORS check passed")
        else:
            print("❌ User Service CORS header missing")
    except Exception as e:
        print(f"❌ User Service CORS check failed: {str(e)}")

if __name__ == "__main__":
    print(f"Testing deployed services at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Auth Service URL: {AUTH_SERVICE_URL}")
    print(f"User Service URL: {USER_SERVICE_URL}")
    print("\nPlease update the URLs at the top of this script with your actual deployed URLs.")
    
    test_health_endpoints()
    test_user_service_endpoints()
    test_auth_service_endpoints()
    test_cors_configuration()
    
    print("\n===== Test Summary =====")
    print("This was a basic connectivity test.")
    print("Some tests may have failed if authentication is required or if using mock data.")
    print("Update the script with valid credentials for more thorough testing.") 