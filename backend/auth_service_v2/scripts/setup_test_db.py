"""
Script to set up the test database for running tests
"""
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def setup_test_database():
    """Create the test database if it doesn't exist"""
    conn = None
    cursor = None
    try:
        # Connect to PostgreSQL server
        conn = psycopg2.connect(
            host="localhost",
            user="postgres",
            password="password"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute("SELECT 1 FROM pg_database WHERE datname='candidatev_auth_test'")
        exists = cursor.fetchone()
        
        if not exists:
            # Create database
            cursor.execute('CREATE DATABASE candidatev_auth_test')
            logger.info("Test database created successfully")
        else:
            logger.info("Test database already exists")
            
    except Exception as e:
        logger.error(f"Error setting up test database: {str(e)}")
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    setup_test_database() 