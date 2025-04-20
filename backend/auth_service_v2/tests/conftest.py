import os
import pytest
from typing import Generator, Dict, AsyncGenerator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import ProgrammingError
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.core.config import settings
from app.db.session import get_db, AsyncSessionLocal, engine
from app.db.models import Base
from app.main import app  # We'll create this later
from tests.utils.user import authentication_token_from_email
from tests.utils.utils import get_superuser_token_headers
from app.api import deps

# Set up test email configuration
os.environ.update({
    "MAIL_USERNAME": "test@example.com",
    "MAIL_PASSWORD": "testpassword",
    "MAIL_PORT": "587",
    "MAIL_SERVER": "smtp.example.com",
    "MAIL_FROM": "test@example.com",
    "MAIL_TLS": "True",
    "MAIL_SSL": "False",
    "USE_CREDENTIALS": "True"
})

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

# Use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine_test = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    echo=True
)

TestingAsyncSessionLocal = sessionmaker(
    engine_test,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def db() -> AsyncGenerator[AsyncSession, None]:
    """Session-wide test database."""
    async with engine_test.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
    
    async with TestingAsyncSessionLocal() as session:
        yield session
    
    async with engine_test.begin() as conn:
        # Drop all tables
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture(scope="function")
async def db_session(db: AsyncSession) -> AsyncGenerator[AsyncSession, None]:
    """Creates a fresh database session for a test."""
    async with db.begin():
        yield db
        await db.rollback()

@pytest.fixture(scope="function")
def client(db_session: AsyncSession) -> Generator:
    """Create a new FastAPI TestClient that uses the `db_session` fixture to override
    the `get_db` dependency that is injected into routes.
    """
    async def _get_test_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _get_test_db
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
