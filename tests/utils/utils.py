"""General test utilities."""
from typing import Dict
from fastapi.testclient import TestClient
from app.core.config import settings

def get_superuser_token_headers(client: TestClient) -> Dict[str, str]:
    """
    Return a valid token for the superuser.
    """
    login_data = {
        "username": settings.FIRST_SUPERUSER,
        "password": settings.FIRST_SUPERUSER_PASSWORD,
    }
    r = client.post(f"{settings.API_V1_STR}/auth/login", data=login_data)
    tokens = r.json()
    return {"Authorization": f"Bearer {tokens['access_token']}"} 