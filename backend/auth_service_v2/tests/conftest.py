import os
import pytest
from typing import Generator, Dict
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import ProgrammingError

from app.core.config import settings
from app.db.session import get_db, SessionLocal, engine
from app.db.models import Base
from app.main import app  # We'll create this later
from tests.utils.user import authentication_token_from_email
from tests.utils.utils import get_superuser_token_headers
from app.api import deps

# Override the database URL for testing
settings.DATABASE_URL = os.getenv(
    "RAILWAY_PUBLIC_POSTGRESQL_URL",
    "postgresql://postgres:postgres@localhost:5432/candidatev_test"
)
settings.SQLALCHEMY_DATABASE_URI = settings.DATABASE_URL

# Use Railway's public URL for testing
TEST_DB_NAME = "candidatev_auth_test"
RAILWAY_PUBLIC_HOST = "switchback.proxy.rlwy.net"
RAILWAY_PUBLIC_PORT = "29421"

MAIN_DATABASE_URL = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{RAILWAY_PUBLIC_HOST}:{RAILWAY_PUBLIC_PORT}/railway"
TEST_DATABASE_URL = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{RAILWAY_PUBLIC_HOST}:{RAILWAY_PUBLIC_PORT}/{TEST_DB_NAME}"

@pytest.fixture(scope="session")
def test_db_engine():
    # First connect to the main database to create test database
    main_engine = create_engine(MAIN_DATABASE_URL, pool_pre_ping=True)
    
    try:
        # Try to create the test database
        with main_engine.connect() as conn:
            conn.execute(text("commit"))  # Close any open transactions
            conn.execute(text(f"DROP DATABASE IF EXISTS {TEST_DB_NAME}"))
            conn.execute(text(f"CREATE DATABASE {TEST_DB_NAME}"))
    except ProgrammingError as e:
        print(f"Error setting up test database: {e}")
        raise
    finally:
        main_engine.dispose()

    # Create a new engine connected to the test database
    test_engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)
    
    try:
        # Create all tables in the test database
        Base.metadata.create_all(bind=test_engine)
        yield test_engine
    finally:
        Base.metadata.drop_all(bind=test_engine)
        test_engine.dispose()
        
        # Clean up by connecting to main DB and dropping test DB
        main_engine = create_engine(MAIN_DATABASE_URL, pool_pre_ping=True)
        with main_engine.connect() as conn:
            conn.execute(text("commit"))
            conn.execute(text(f"DROP DATABASE IF EXISTS {TEST_DB_NAME}"))
        main_engine.dispose()

@pytest.fixture(scope="function")
def db_session(test_db_engine):
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=test_db_engine
    )
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.rollback()
        db.close()

@pytest.fixture(scope="function")
def client(db_session) -> Generator:
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def test_user():
    """Test user fixture."""
    return {
        "email": "test@example.com",
        "password": "testpassword123",
        "name": "Test User",
        "is_active": True,
        "is_superuser": False
    }

@pytest.fixture
def test_superuser():
    """Test superuser fixture."""
    return {
        "email": "admin@example.com",
        "password": "adminpassword123",
        "name": "Admin User",
        "is_active": True,
        "is_superuser": True
    }

@pytest.fixture(scope="function")
def test_auth_headers(client, test_user) -> Dict[str, str]:
    """Get authentication headers for test user"""
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": test_user["email"],
            "password": test_user["password"]
        }
    )
    tokens = response.json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}
