"""
End-to-end test script for user flows.
This script tests the complete user journey from registration to profile update.

Usage: python test_user_flows.py
"""

import requests
import json
import uuid
from datetime import datetime

# Replace with your actual API Gateway URL or service URLs
API_GATEWAY_URL = "https://candidate-v.vercel.app/api"
# If you're not using the API Gateway, you can use direct service URLs:
# AUTH_SERVICE_URL = "https://your-auth-service.railway.app"
# USER_SERVICE_URL = "https://your-user-service.railway.app"

class UserFlowTest:
    def __init__(self):
        self.access_token = None
        self.refresh_token = None
        self.user_id = None
        self.email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        self.password = "Test1234!"
        self.name = "Test User"
        
        print(f"\n===== Starting User Flow Test at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} =====")
        print(f"Using email: {self.email}")
        
    def run(self):
        """Run the complete test flow."""
        try:
            self.test_registration()
            self.test_login()
            if self.access_token:
                self.test_get_profile()
                self.test_update_profile()
                self.test_update_preferences()
                self.test_logout()
            
            print("\n===== Test Flow Complete =====")
            print("✅ All tests completed")
            return True
        except Exception as e:
            print(f"\n❌ Test flow failed: {str(e)}")
            return False
    
    def test_registration(self):
        """Test user registration."""
        print("\n----- Testing User Registration -----")
        
        register_data = {
            "email": self.email,
            "password": self.password,
            "name": self.name
        }
        
        response = requests.post(
            f"{API_GATEWAY_URL}/auth/register",
            json=register_data
        )
        
        print(f"Registration Status: {response.status_code}")
        
        if response.status_code == 201:
            user_data = response.json()
            self.user_id = user_data.get("id")
            print(f"User created with ID: {self.user_id}")
            print("✅ Registration successful")
        else:
            print(f"Response: {response.text}")
            raise Exception(f"Registration failed with status {response.status_code}")
    
    def test_login(self):
        """Test user login."""
        print("\n----- Testing User Login -----")
        
        login_data = {
            "username": self.email,
            "password": self.password
        }
        
        response = requests.post(
            f"{API_GATEWAY_URL}/auth/login",
            data=login_data  # Note: login uses form data, not JSON
        )
        
        print(f"Login Status: {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            self.access_token = token_data.get("access_token")
            self.refresh_token = token_data.get("refresh_token")
            print(f"Access Token: {self.access_token[:10]}...")
            print(f"Refresh Token: {self.refresh_token[:10]}...")
            print("✅ Login successful")
        else:
            print(f"Response: {response.text}")
            raise Exception(f"Login failed with status {response.status_code}")
    
    def test_get_profile(self):
        """Test getting user profile."""
        print("\n----- Testing Get User Profile -----")
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        response = requests.get(
            f"{API_GATEWAY_URL}/users/me",
            headers=headers
        )
        
        print(f"Get Profile Status: {response.status_code}")
        
        if response.status_code == 200:
            profile_data = response.json()
            print(f"Profile: {json.dumps(profile_data, indent=2)}")
            print("✅ Get profile successful")
        else:
            print(f"Response: {response.text}")
            raise Exception(f"Get profile failed with status {response.status_code}")
    
    def test_update_profile(self):
        """Test updating user profile."""
        print("\n----- Testing Update User Profile -----")
        
        update_data = {
            "bio": f"Test bio updated at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "job_title": "Test Engineer",
            "location": "Test City"
        }
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        response = requests.put(
            f"{API_GATEWAY_URL}/users/me",
            json=update_data,
            headers=headers
        )
        
        print(f"Update Profile Status: {response.status_code}")
        
        if response.status_code == 200:
            updated_profile = response.json()
            print(f"Updated Bio: {updated_profile.get('bio')}")
            print(f"Updated Job Title: {updated_profile.get('job_title')}")
            print("✅ Update profile successful")
        else:
            print(f"Response: {response.text}")
            raise Exception(f"Update profile failed with status {response.status_code}")
    
    def test_update_preferences(self):
        """Test updating user preferences."""
        print("\n----- Testing Update User Preferences -----")
        
        preferences_data = {
            "preferences": {
                "theme": "dark",
                "notifications": True
            }
        }
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        response = requests.put(
            f"{API_GATEWAY_URL}/users/me/preferences",
            json=preferences_data,
            headers=headers
        )
        
        print(f"Update Preferences Status: {response.status_code}")
        
        if response.status_code == 200:
            pref_data = response.json()
            print(f"Updated Preferences: {json.dumps(pref_data, indent=2)}")
            print("✅ Update preferences successful")
        else:
            print(f"Response: {response.text}")
            raise Exception(f"Update preferences failed with status {response.status_code}")
    
    def test_logout(self):
        """Test user logout."""
        print("\n----- Testing User Logout -----")
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        response = requests.post(
            f"{API_GATEWAY_URL}/auth/logout",
            headers=headers
        )
        
        print(f"Logout Status: {response.status_code}")
        
        if response.status_code == 200:
            print(f"Response: {response.text}")
            print("✅ Logout successful")
        else:
            print(f"Response: {response.text}")
            raise Exception(f"Logout failed with status {response.status_code}")

if __name__ == "__main__":
    print(f"API Gateway URL: {API_GATEWAY_URL}")
    print("Please update the URL at the top of this script with your actual deployed URL.")
    
    test = UserFlowTest()
    test.run() 