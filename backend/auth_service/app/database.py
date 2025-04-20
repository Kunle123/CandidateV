from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
import os
from contextlib import contextmanager
import logging
from fastapi import Depends

logger = logging.getLogger(__name__)

# Define Base before it's used by models (which might be imported elsewhere)
Base = declarative_base()

def create_db_engine():
    """Creates the SQLAlchemy engine. Reads URL from env.
    Raises Exception if connection fails.
    """
    DATABASE_URL = os.getenv("DATABASE_URL")
    logger.info(f"Attempting DB connection using DATABASE_URL: {DATABASE_URL}")
    if not DATABASE_URL:
        logger.error("DATABASE_URL environment variable is not set")
        raise ValueError("DATABASE_URL environment variable is not set")

    try:
        engine = create_engine(
            DATABASE_URL,
            poolclass=QueuePool,
            pool_size=10,
            max_overflow=20,
            pool_timeout=30,
            pool_recycle=1800,
            # Optionally test connection on creation - might slow startup slightly
            # pool_pre_ping=True 
        )
        # Optional: Perform a simple connection test
        # with engine.connect() as connection:
        #     logger.info("Initial DB connection test successful.")
            
        logger.info("SQLAlchemy engine object created.")
        return engine
    except Exception as e:
        logger.error(f"Failed to create SQLAlchemy engine: {e}", exc_info=True)
        raise # Re-raise exception to be handled by lifespan

def close_db_engine(engine):
    """Closes the engine's connection pool."""
    if engine:
        logger.info("Disposing SQLAlchemy engine connection pool.")
        engine.dispose()
    else:
        logger.warning("Attempted to close a non-existent DB engine.")

# SessionLocal can be defined here, but will only work if engine is created successfully
# It's often better to create SessionLocal after engine creation in lifespan or pass engine
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) 

@contextmanager
def get_db(engine_instance):
    """Context manager for database sessions, requires engine instance."""
    # Create a Session factory bound to the specific engine instance
    SessionLocal_instance = sessionmaker(autocommit=False, autoflush=False, bind=engine_instance)
    db = SessionLocal_instance()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

def get_db_session(engine_instance: sqlalchemy.engine.Engine = Depends(lambda: app.state.db_engine)):
    """FastAPI dependency to get a DB session. Assumes engine is in app.state.
       NOTE: This dependency approach couples endpoint functions to app.state.
       A different pattern might be needed if app.state isn't used.
    """
    # Need to import Depends and potentially 'app' from main or pass app state differently
    # For now, this structure illustrates the dependency but might need adjustment.
    if not hasattr(engine_instance, 'connect'): # Basic check
         raise RuntimeError("Database engine not available in app state.")
         
    with get_db(engine_instance) as session:
        yield session 