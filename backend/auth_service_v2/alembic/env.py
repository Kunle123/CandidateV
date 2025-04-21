"""Alembic environment configuration."""
import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the SQLAlchemy declarative_base and settings
from app.db.base import Base  # noqa
from app.core.config import settings  # noqa

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Get target metadata
target_metadata = Base.metadata

# Force sync driver for migrations
os.environ["USE_SYNC_DRIVER"] = "true"

def get_url():
    """Get database URL from settings with fallback."""
    return os.getenv("DATABASE_URL", settings.SQLALCHEMY_DATABASE_URI)

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_url()
    
    # Configure the connection pool for migrations
    configuration["sqlalchemy.pool_pre_ping"] = "true"
    configuration["sqlalchemy.pool_size"] = "5"
    configuration["sqlalchemy.max_overflow"] = "10"
    configuration["sqlalchemy.pool_timeout"] = "60"
    configuration["sqlalchemy.pool_recycle"] = "1800"

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.QueuePool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online() 