"""Create users table

Revision ID: create_users_table
Revises: 
Create Date: 2024-04-20 18:55:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
import uuid

# revision identifiers, used by Alembic.
revision = 'create_users_table'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    """Create users table."""
    op.create_table(
        'users',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_superuser', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('full_name', sa.String(), nullable=True)
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_id', 'users', ['id'], unique=True)

def downgrade():
    """Drop users table."""
    op.drop_index('ix_users_id', 'users')
    op.drop_index('ix_users_email', 'users')
    op.drop_table('users') 