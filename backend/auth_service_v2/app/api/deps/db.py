"""Database dependency module."""
from typing import AsyncGenerator
from app.db.session import AsyncSessionLocal

async def get_db() -> AsyncGenerator:
    """Get database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close() 