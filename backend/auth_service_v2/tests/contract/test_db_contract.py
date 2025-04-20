"""Contract tests for validating database schema and model constraints."""
import pytest
from sqlalchemy import inspect
from sqlalchemy.sql import sqltypes

from app.db.models import User, Token
from app.db.session import engine

def get_column_info(model):
    """Get column information for a SQLAlchemy model."""
    return {
        column.name: {
            "type": type(column.type),
            "nullable": column.nullable,
            "primary_key": column.primary_key,
            "unique": column.unique,
        }
        for column in inspect(model).columns
    }

def test_user_model_schema():
    """Test that User model has the expected schema."""
    columns = get_column_info(User)
    
    # Test required columns exist
    assert "id" in columns
    assert "email" in columns
    assert "name" in columns
    assert "hashed_password" in columns
    assert "is_active" in columns
    assert "is_superuser" in columns
    
    # Test column types
    assert columns["id"]["type"] == sqltypes.Integer
    assert columns["email"]["type"] == sqltypes.String
    assert columns["name"]["type"] == sqltypes.String
    assert columns["hashed_password"]["type"] == sqltypes.String
    assert columns["is_active"]["type"] == sqltypes.Boolean
    assert columns["is_superuser"]["type"] == sqltypes.Boolean
    
    # Test constraints
    assert columns["id"]["primary_key"] is True
    assert columns["email"]["unique"] is True
    assert columns["email"]["nullable"] is False
    assert columns["name"]["nullable"] is False
    assert columns["hashed_password"]["nullable"] is False

def test_token_model_schema():
    """Test that Token model has the expected schema."""
    columns = get_column_info(Token)
    
    # Test required columns exist
    assert "id" in columns
    assert "token" in columns
    assert "token_type" in columns
    assert "expires_at" in columns
    assert "user_id" in columns
    
    # Test column types
    assert columns["id"]["type"] == sqltypes.Integer
    assert columns["token"]["type"] == sqltypes.String
    assert columns["token_type"]["type"] == sqltypes.String
    assert columns["expires_at"]["type"] == sqltypes.DateTime
    assert columns["user_id"]["type"] == sqltypes.Integer
    
    # Test constraints
    assert columns["id"]["primary_key"] is True
    assert columns["token"]["unique"] is True
    assert columns["token"]["nullable"] is False
    assert columns["token_type"]["nullable"] is False
    assert columns["expires_at"]["nullable"] is False
    assert columns["user_id"]["nullable"] is False

def test_database_tables_exist():
    """Test that all required database tables exist."""
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    assert "users" in tables
    assert "tokens" in tables

def test_foreign_key_constraints():
    """Test that foreign key constraints are properly set up."""
    inspector = inspect(engine)
    
    # Check foreign keys in tokens table
    fks = inspector.get_foreign_keys("tokens")
    assert len(fks) == 1  # Should have one foreign key
    
    fk = fks[0]
    assert fk["referred_table"] == "users"
    assert fk["referred_columns"] == ["id"]
    assert fk["constrained_columns"] == ["user_id"] 