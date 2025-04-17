"""Optimize preferences and image storage

Revision ID: 0002
Revises: 0001
Create Date: 2025-04-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0002'
down_revision: Union[str, None] = '0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create GIN index for JSONB preferences for faster queries
    op.create_index(
        'ix_user_profiles_preferences_gin',
        'user_profiles',
        ['preferences'],
        postgresql_using='gin'
    )
    
    # Add a trigger to automatically update the updated_at timestamp
    op.execute("""
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
    """)
    
    op.execute("""
    CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    """)
    
    # Create uploads directory if using local storage
    op.execute("""
    DO $$ 
    BEGIN
        -- This is a PL/pgSQL block that will be executed on the database
        -- We don't actually create the directory here since that's filesystem related
        -- but we'll leave this placeholder for documentation purposes
        RAISE NOTICE 'Remember to create uploads directory for local storage';
    END $$;
    """)


def downgrade() -> None:
    # Drop trigger
    op.execute("DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;")
    
    # Drop function
    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column();")
    
    # Drop index
    op.drop_index('ix_user_profiles_preferences_gin', table_name='user_profiles') 