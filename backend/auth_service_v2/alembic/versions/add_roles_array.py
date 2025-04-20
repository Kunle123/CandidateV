"""Add roles array to users table."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic
revision = '20250420_1325_49bbfcf10720'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    """Add roles array column to users table."""
    op.add_column(
        'users',
        sa.Column('roles', sa.ARRAY(sa.String()), nullable=False, server_default='{}')
    )
    
    # Create tokens table
    op.create_table(
        'tokens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('token', sa.String(), nullable=False),
        sa.Column('token_type', sa.String(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_tokens_id', 'tokens', ['id'], unique=False)
    op.create_index('ix_tokens_token', 'tokens', ['token'], unique=True)

def downgrade():
    """Remove roles array column from users table."""
    op.drop_column('users', 'roles')
    
    # Drop tokens table
    op.drop_index('ix_tokens_token', 'tokens')
    op.drop_index('ix_tokens_id', 'tokens')
    op.drop_table('tokens') 