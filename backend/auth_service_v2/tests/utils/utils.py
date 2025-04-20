"""Test utilities."""
from typing import Dict
from app.core.config import settings
from tests.utils.user import authentication_token_from_email

def get_superuser_token_headers() -> Dict[str, str]:
    """Get a superuser token for testing."""
    return authentication_token_from_email("admin@example.com") 