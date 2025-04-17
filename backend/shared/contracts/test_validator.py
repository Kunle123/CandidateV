import unittest
import json
import os
from .validator import ContractValidator

class TestContractValidator(unittest.TestCase):
    """Test the ContractValidator class."""
    
    def setUp(self):
        """Set up test environment."""
        self.auth_validator = ContractValidator("auth_service")
        self.user_validator = ContractValidator("user_service")
        self.cv_validator = ContractValidator("cv_service")
    
    def test_auth_login_valid_request(self):
        """Test validation of a valid login request."""
        path = "/api/auth/login"
        method = "post"
        data = {
            "email": "user@example.com",
            "password": "securepassword"
        }
        
        error = self.auth_validator.validate_request(path, method, data)
        self.assertIsNone(error, f"Validation error: {error}")
    
    def test_auth_login_invalid_request(self):
        """Test validation of an invalid login request."""
        path = "/api/auth/login"
        method = "post"
        data = {
            "email": "not_an_email",  # Invalid email
            "password": "securepassword"
        }
        
        error = self.auth_validator.validate_request(path, method, data)
        self.assertIsNotNone(error)
        self.assertIn("validation error", error.lower())
    
    def test_auth_login_missing_field(self):
        """Test validation of a login request with missing field."""
        path = "/api/auth/login"
        method = "post"
        data = {
            "email": "user@example.com"
            # Missing password field
        }
        
        error = self.auth_validator.validate_request(path, method, data)
        self.assertIsNotNone(error)
        self.assertIn("validation error", error.lower())
    
    def test_auth_login_valid_response(self):
        """Test validation of a valid login response."""
        path = "/api/auth/login"
        method = "post"
        status_code = 200
        data = {
            ***REMOVED***,
            "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "token_type": "bearer",
            "expires_in": 1800
        }
        
        error = self.auth_validator.validate_response(path, method, status_code, data)
        self.assertIsNone(error, f"Validation error: {error}")
    
    def test_auth_login_invalid_response(self):
        """Test validation of an invalid login response."""
        path = "/api/auth/login"
        method = "post"
        status_code = 200
        data = {
            ***REMOVED***,
            "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "token_type": "invalid_type",  # Invalid token type
            "expires_in": 1800
        }
        
        error = self.auth_validator.validate_response(path, method, status_code, data)
        self.assertIsNotNone(error)
        self.assertIn("validation error", error.lower())
    
    def test_user_profile_valid_update(self):
        """Test validation of a valid profile update request."""
        path = "/api/users/me"
        method = "put"
        data = {
            "bio": "Professional software developer",
            "job_title": "Senior Developer",
            "location": "New York",
            "website": "https://example.com",
            "social_links": {
                "linkedin": "https://linkedin.com/in/johndoe",
                "github": "https://github.com/johndoe",
                "twitter": "https://twitter.com/johndoe"
            }
        }
        
        error = self.user_validator.validate_request(path, method, data)
        self.assertIsNone(error, f"Validation error: {error}")
    
    def test_user_profile_invalid_update(self):
        """Test validation of an invalid profile update request."""
        path = "/api/users/me"
        method = "put"
        data = {
            "bio": "Professional software developer",
            "job_title": "Senior Developer",
            "location": "New York",
            "website": "not-a-valid-url",  # Invalid URL format
            "social_links": {
                "linkedin": "not-a-valid-url",  # Invalid URL format
                "github": "https://github.com/johndoe",
                "twitter": "https://twitter.com/johndoe"
            }
        }
        
        error = self.user_validator.validate_request(path, method, data)
        self.assertIsNotNone(error)
        self.assertIn("validation error", error.lower())

    def test_cv_create_valid_request(self):
        """Test validation of a valid CV creation request."""
        path = "/api/cv"
        method = "post"
        data = {
            "name": "My Professional CV",
            "description": "CV for software engineering positions",
            "is_default": True,
            "template_id": "professional"
        }
        
        error = self.cv_validator.validate_request(path, method, data)
        self.assertIsNone(error, f"Validation error: {error}")
    
    def test_cv_create_invalid_request(self):
        """Test validation of an invalid CV creation request."""
        path = "/api/cv"
        method = "post"
        data = {
            # Missing required 'name' field
            "description": "CV for software engineering positions",
            "is_default": True,
            "template_id": "professional"
        }
        
        error = self.cv_validator.validate_request(path, method, data)
        self.assertIsNotNone(error)
        self.assertIn("validation error", error.lower())
    
    def test_cv_metadata_update_valid_request(self):
        """Test validation of a valid CV metadata update request."""
        path = "/api/cv/{cv_id}/metadata"
        method = "put"
        data = {
            "name": "Updated CV Title",
            "description": "Updated description",
            "is_default": True
        }
        
        error = self.cv_validator.validate_request(path, method, data)
        self.assertIsNone(error, f"Validation error: {error}")
    
    def test_cv_content_update_valid_request(self):
        """Test validation of a valid CV content update request."""
        path = "/api/cv/{cv_id}/content"
        method = "put"
        data = {
            "template_id": "modern",
            "style_options": {
                "color_scheme": "teal",
                "font_family": "Montserrat"
            },
            "personal_info": {
                "full_name": "John Doe",
                "email": "john.doe@example.com",
                "phone": "+1 (123) 456-7890"
            },
            "summary": "Experienced software developer"
        }
        
        error = self.cv_validator.validate_request(path, method, data)
        self.assertIsNone(error, f"Validation error: {error}")
    
    def test_cv_share_valid_request(self):
        """Test validation of a valid CV share request."""
        path = "/api/cv/{cv_id}/share"
        method = "post"
        data = {
            "expires_in_days": 30
        }
        
        error = self.cv_validator.validate_request(path, method, data)
        self.assertIsNone(error, f"Validation error: {error}")
    
    def test_cv_share_valid_response(self):
        """Test validation of a valid CV share response."""
        path = "/api/cv/{cv_id}/share"
        method = "post"
        status_code = 200
        data = {
            "share_url": "https://cv.candidatev.com/share/abc123",
            "expires_at": "2025-05-10T15:30:00Z"
        }
        
        error = self.cv_validator.validate_response(path, method, status_code, data)
        self.assertIsNone(error, f"Validation error: {error}")

if __name__ == "__main__":
    unittest.main() 