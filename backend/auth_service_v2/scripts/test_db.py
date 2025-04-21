"""Test database connectivity."""
import os
import sys
import time
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

def test_db_connection(retries=5, delay=2):
    # Get both possible database URLs
    db_url = os.environ.get("DATABASE_URL")
    sqlalchemy_url = os.environ.get("SQLALCHEMY_DATABASE_URI")
    
    print("Testing Database Configuration:")
    print(f"DATABASE_URL: {'[SET]' if db_url else '[NOT SET]'}")
    print(f"SQLALCHEMY_DATABASE_URI: {'[SET]' if sqlalchemy_url else '[NOT SET]'}")
    
    # Try both URLs
    urls_to_test = []
    if db_url:
        urls_to_test.append(("DATABASE_URL", db_url))
    if sqlalchemy_url:
        urls_to_test.append(("SQLALCHEMY_DATABASE_URI", sqlalchemy_url))
    
    if not urls_to_test:
        print("ERROR: No database URLs configured")
        return False
    
    success = False
    for url_name, url in urls_to_test:
        print(f"\nTesting {url_name}:")
        # Mask password in output
        masked_url = url
        if "@" in url:
            prefix, suffix = url.split("@", 1)
            if ":" in prefix:
                protocol_user, password = prefix.rsplit(":", 1)
                masked_url = f"{protocol_user}:****@{suffix}"
        print(f"URL: {masked_url}")
        
        for attempt in range(1, retries + 1):
            try:
                print(f"Attempt {attempt}/{retries}...")
                # For migrations, convert asyncpg to postgresql
                test_url = url.replace("postgresql+asyncpg://", "postgresql://")
                engine = create_engine(test_url)
                with engine.connect() as conn:
                    result = conn.execute(text("SELECT 1"))
                    print(f"SUCCESS: Database connection established via {url_name}")
                    
                    # Get database info
                    try:
                        version = conn.execute(text("SHOW server_version")).scalar()
                        print(f"PostgreSQL version: {version}")
                        
                        # List tables
                        tables = conn.execute(text(
                            "SELECT table_name FROM information_schema.tables "
                            "WHERE table_schema = 'public'"
                        )).scalars().all()
                        
                        if tables:
                            print(f"Found {len(tables)} tables: {', '.join(tables)}")
                        else:
                            print("WARNING: No tables found in database")
                    except Exception as e:
                        print(f"Could not get database info: {str(e)}")
                    
                    success = True
                    break
            except SQLAlchemyError as e:
                print(f"ERROR: Database connection failed: {str(e)}")
                if attempt < retries:
                    print(f"Retrying in {delay} seconds...")
                    time.sleep(delay)
            except Exception as e:
                print(f"UNEXPECTED ERROR: {str(e)}")
                break
    
    return success

if __name__ == "__main__":
    success = test_db_connection()
    sys.exit(0 if success else 1) 