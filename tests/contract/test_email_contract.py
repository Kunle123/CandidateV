"""Contract tests for validating email service integration."""
import pytest
from unittest.mock import patch
from typing import Dict, Any

from app.core.config import settings
from app.services.email import (
    send_email,
    send_reset_password_email,
    send_verification_email,
    send_new_account_email
)

def validate_email_payload(payload: Dict[str, Any], required_fields: list):
    """Helper function to validate email payload structure."""
    for field in required_fields:
        assert field in payload, f"Missing required field: {field}"
    
    assert isinstance(payload["to_email"], str)
    assert "@" in payload["to_email"]
    assert isinstance(payload["subject"], str)
    assert len(payload["subject"]) > 0
    assert isinstance(payload["body"], str)
    assert len(payload["body"]) > 0

@pytest.mark.asyncio
async def test_reset_password_email_contract():
    """Test that password reset email meets the contract requirements."""
    test_email = "test@example.com"
    test_token = "test-reset-token"
    
    with patch("app.services.email.send_email") as mock_send:
        await send_reset_password_email(
            email_to=test_email,
            token=test_token
        )
        
        # Verify the email was attempted to be sent
        assert mock_send.called
        
        # Get the payload that would have been sent
        payload = mock_send.call_args[0][0]
        
        # Validate payload structure
        required_fields = ["to_email", "subject", "body"]
        validate_email_payload(payload, required_fields)
        
        # Verify contract-specific requirements
        assert test_email == payload["to_email"]
        assert "Password Reset" in payload["subject"]
        assert test_token in payload["body"]
        assert settings.SERVER_HOST in payload["body"]

@pytest.mark.asyncio
async def test_verification_email_contract():
    """Test that email verification message meets the contract requirements."""
    test_email = "test@example.com"
    test_token = "test-verification-token"
    
    with patch("app.services.email.send_email") as mock_send:
        await send_verification_email(
            email_to=test_email,
            token=test_token
        )
        
        assert mock_send.called
        payload = mock_send.call_args[0][0]
        
        required_fields = ["to_email", "subject", "body"]
        validate_email_payload(payload, required_fields)
        
        assert test_email == payload["to_email"]
        assert "Verify Email" in payload["subject"]
        assert test_token in payload["body"]
        assert settings.SERVER_HOST in payload["body"]

@pytest.mark.asyncio
async def test_new_account_email_contract():
    """Test that new account notification meets the contract requirements."""
    test_email = "test@example.com"
    test_name = "Test User"
    
    with patch("app.services.email.send_email") as mock_send:
        await send_new_account_email(
            email_to=test_email,
            name=test_name
        )
        
        assert mock_send.called
        payload = mock_send.call_args[0][0]
        
        required_fields = ["to_email", "subject", "body"]
        validate_email_payload(payload, required_fields)
        
        assert test_email == payload["to_email"]
        assert "Welcome" in payload["subject"]
        assert test_name in payload["body"]

@pytest.mark.asyncio
async def test_email_error_handling():
    """Test that email service properly handles errors according to contract."""
    test_email = "invalid@"
    
    with pytest.raises(ValueError):
        await send_new_account_email(
            email_to=test_email,
            name="Test User"
        )
    
    with patch("app.services.email.send_email") as mock_send:
        mock_send.side_effect = Exception("SMTP Error")
        
        # Service should handle SMTP errors gracefully
        with pytest.raises(Exception) as exc_info:
            await send_new_account_email(
                email_to="test@example.com",
                name="Test User"
            )
        
        assert "email service" in str(exc_info.value).lower() 