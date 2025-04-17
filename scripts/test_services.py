import requests
import json
import time
import sys

# Configuration
AUTH_SERVICE_URL = "http://localhost:8000"
USER_SERVICE_URL = "http://localhost:8001"
API_GATEWAY_URL = "http://localhost:3000"

# Test data
TEST_USER = {
    "email": "test@example.com",
    "password": "Test1234!",
    "name": "Test User"
}

def print_colored(text, color_code):
    print(f"\033[{color_code}m{text}\033[0m")

def print_success(text):
    print_colored(f"✓ {text}", "92")

def print_error(text):
    print_colored(f"✗ {text}", "91")

def print_info(text):
    print_colored(text, "94")

def print_warning(text):
    print_colored(text, "93")

def print_header(text):
    print("\n" + "=" * 50)
    print_colored(text, "96")
    print("=" * 50)

def test_health_check(service_name, url):
    print_info(f"Testing {service_name} health check...")
    try:
        response = requests.get(f"{url}/api/health")
        response.raise_for_status()
        data = response.json()
        print_success(f"{service_name} health check: {data['status']}")
        return True
    except Exception as e:
        print_error(f"{service_name} health check failed: {str(e)}")
        return False

def test_auth_service():
    print_header("Testing Authentication Service")
    
    # Test health check
    if not test_health_check("Auth Service", AUTH_SERVICE_URL):
        return None, None
    
    # Test registration
    print_info("Testing user registration...")
    try:
        response = requests.post(
            f"{AUTH_SERVICE_URL}/api/auth/register",
            json=TEST_USER
        )
        
        if response.status_code == 201:
            print_success("User registration successful")
        elif response.status_code == 400 and "Email already registered" in response.text:
            print_warning("User already exists, proceeding to login")
        else:
            response.raise_for_status()
    except Exception as e:
        print_error(f"User registration failed: {str(e)}")
        return None, None
    
    # Test login
    print_info("Testing user login...")
    try:
        response = requests.post(
            f"{AUTH_SERVICE_URL}/api/auth/login",
            data={
                "username": TEST_USER["email"],
                "password": TEST_USER["password"]
            }
        )
        response.raise_for_status()
        data = response.json()
        access_token = data["access_token"]
        refresh_token = data["refresh_token"]
        print_success("User login successful")
        return access_token, refresh_token
    except Exception as e:
        print_error(f"User login failed: {str(e)}")
        return None, None

def test_user_service(access_token):
    print_header("Testing User Management Service")
    
    # Test health check
    if not test_health_check("User Service", USER_SERVICE_URL):
        return False
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Test get user profile
    print_info("Testing get user profile...")
    try:
        response = requests.get(
            f"{USER_SERVICE_URL}/api/users/me",
            headers=headers
        )
        response.raise_for_status()
        data = response.json()
        print_success(f"Get user profile successful: {data['name']}")
    except Exception as e:
        print_error(f"Get user profile failed: {str(e)}")
        return False
    
    # Test update user profile
    print_info("Testing update user profile...")
    try:
        response = requests.put(
            f"{USER_SERVICE_URL}/api/users/me",
            headers=headers,
            json={
                "bio": "This is a test bio",
                "job_title": "Software Developer",
                "location": "Test City"
            }
        )
        response.raise_for_status()
        data = response.json()
        print_success(f"Update user profile successful: {data['job_title']}")
    except Exception as e:
        print_error(f"Update user profile failed: {str(e)}")
        return False
    
    # Test update user preferences
    print_info("Testing update user preferences...")
    try:
        response = requests.put(
            f"{USER_SERVICE_URL}/api/users/me/preferences",
            headers=headers,
            json={
                "preferences": {
                    "theme": "dark",
                    "notifications": True,
                    "email_notifications": False
                }
            }
        )
        response.raise_for_status()
        data = response.json()
        print_success(f"Update user preferences successful: {data['preferences']['theme']}")
    except Exception as e:
        print_error(f"Update user preferences failed: {str(e)}")
        return False
    
    return True

def test_api_gateway(access_token):
    print_header("Testing API Gateway")
    
    # Test health check
    print_info("Testing API Gateway health check...")
    try:
        response = requests.get(f"{API_GATEWAY_URL}/api/health")
        response.raise_for_status()
        data = response.json()
        print_success(f"API Gateway health check: {data['status']}")
    except Exception as e:
        print_error(f"API Gateway health check failed: {str(e)}")
        return False
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Test auth service through API Gateway
    print_info("Testing Auth Service through API Gateway...")
    try:
        response = requests.post(
            f"{API_GATEWAY_URL}/api/auth/login",
            data={
                "username": TEST_USER["email"],
                "password": TEST_USER["password"]
            }
        )
        response.raise_for_status()
        print_success("Auth Service through API Gateway successful")
    except Exception as e:
        print_error(f"Auth Service through API Gateway failed: {str(e)}")
        return False
    
    # Test user service through API Gateway
    print_info("Testing User Service through API Gateway...")
    try:
        response = requests.get(
            f"{API_GATEWAY_URL}/api/users/me",
            headers=headers
        )
        response.raise_for_status()
        print_success("User Service through API Gateway successful")
    except Exception as e:
        print_error(f"User Service through API Gateway failed: {str(e)}")
        return False
    
    return True

def main():
    print_header("CandidateV Service Test Script")
    
    # Test Auth Service
    access_token, refresh_token = test_auth_service()
    if not access_token:
        print_error("Authentication Service test failed. Exiting.")
        sys.exit(1)
    
    # Test User Service
    if not test_user_service(access_token):
        print_error("User Management Service test failed. Exiting.")
        sys.exit(1)
    
    # Test API Gateway
    if not test_api_gateway(access_token):
        print_error("API Gateway test failed. Exiting.")
        sys.exit(1)
    
    print_header("All Tests Passed!")
    print_success("Authentication Service: OK")
    print_success("User Management Service: OK")
    print_success("API Gateway: OK")

if __name__ == "__main__":
    main() 