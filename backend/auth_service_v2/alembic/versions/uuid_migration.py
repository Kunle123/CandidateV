"""Convert ID columns to UUID.

Revision ID: uuid_migration
Revises: add_remaining_tables
Create Date: 2025-04-21 01:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
import uuid

# revision identifiers, used by Alembic.
revision = 'uuid_migration'
down_revision = 'add_remaining_tables'
branch_labels = None
depends_on = None

def upgrade():
    # Enable UUID extension
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    
    # Create a new UUID column
    op.add_column('users', sa.Column('uuid_id', UUID(as_uuid=True), nullable=True))
    
    # Generate UUIDs for existing records
    connection = op.get_bind()
    connection.execute("""
        UPDATE users 
        SET uuid_id = uuid_generate_v4() 
        WHERE uuid_id IS NULL
    """)
    
    # Make the UUID column not nullable
    op.alter_column('users', 'uuid_id', nullable=False)
    
    # Drop the old ID column and rename the UUID column
    op.drop_column('users', 'id')
    op.alter_column('users', 'uuid_id', new_column_name='id')
    
    # Update foreign key constraints in related tables
    for table in ['refresh_tokens', 'password_reset_tokens', 'email_verification_tokens']:
        # Add new UUID column
        op.add_column(table, sa.Column('new_user_id', UUID(as_uuid=True), nullable=True))
        
        # Update the new column with UUIDs from users table
        connection.execute(f"""
            UPDATE {table} t
            SET new_user_id = u.id
            FROM users u
            WHERE t.user_id::text = u.id::text
        """)
        
        # Drop the old foreign key constraint
        op.drop_constraint(f'{table}_user_id_fkey', table, type_='foreignkey')
        
        # Drop the old column and rename the new one
        op.drop_column(table, 'user_id')
        op.alter_column(table, 'new_user_id', new_column_name='user_id')
        
        # Add the new foreign key constraint
        op.create_foreign_key(
            f'{table}_user_id_fkey',
            table,
            'users',
            ['user_id'],
            ['id']
        )

def downgrade():
    # This is a one-way migration - downgrade not supported
    raise NotImplementedError("Downgrade is not supported for UUID migration") 