"""Tests for token models."""
import pytest
from pydantic import ValidationError

from app.models.token import TokenData

def test_token_data():
    """Test TokenData model."""
    # Test with no subject
    token_data = TokenData()
    assert token_data.sub is None

    # Test with subject
    token_data = TokenData(sub="test@example.com")
    assert token_data.sub == "test@example.com"

    # Test with invalid type
    with pytest.raises(ValidationError):
        TokenData(sub=123)  # sub should be string or None 