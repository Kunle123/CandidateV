"""Initial migration

Revision ID: 0001
Revises: 
Create Date: 2025-04-09

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create user_profiles table
    op.create_table(
        'user_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('profile_image_url', sa.String(length=255), nullable=True),
        sa.Column('job_title', sa.String(length=255), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('website', sa.String(length=255), nullable=True),
        sa.Column('social_links', postgresql.JSONB(), nullable=True),
        sa.Column('preferences', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for commonly searched fields
    op.create_index(op.f('ix_user_profiles_job_title'), 'user_profiles', ['job_title'], unique=False)
    op.create_index(op.f('ix_user_profiles_location'), 'user_profiles', ['location'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_user_profiles_location'), table_name='user_profiles')
    op.drop_index(op.f('ix_user_profiles_job_title'), table_name='user_profiles')
    
    # Drop table
    op.drop_table('user_profiles') 