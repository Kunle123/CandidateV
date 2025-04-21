"""Script to test database connection."""
import os
import sys
import asyncio
from sqlalchemy import text

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings

async def test_connection():
    """Test the database connection using settings from environment."""
    print("Testing database connection...")
    print(f"Database URL: {settings.SQLALCHEMY_DATABASE_URI}")
    
    engine = create_async_engine(settings.SQLALCHEMY_DATABASE_URI)
    
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            await conn.commit()
            print("✅ Successfully connected to the database!")
    except Exception as e:
        print("❌ Failed to connect to the database!")
        print(f"Error: {str(e)}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_connection()) 