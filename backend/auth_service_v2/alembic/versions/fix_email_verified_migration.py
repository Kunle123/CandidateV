"""Fix email_verified migration

Revision ID: fix_email_verified
Revises: add_remaining_tables
Create Date: 2025-04-21 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision = 'fix_email_verified'
down_revision = 'add_remaining_tables'
branch_labels = None
depends_on = None

def upgrade():
    # This migration is a no-op as it just acknowledges that email_verified exists
    pass

def downgrade():
    # No downgrade needed as this is just fixing version tracking
    pass 