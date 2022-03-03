"""Initial version

Revision ID: a5ce6a370720
Revises: 
Create Date: 2017-07-27 16:33:04.907944

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a5ce6a370720'
down_revision = None
branch_labels = None
depends_on = None



def upgrade():
    op.create_table('role',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=80), nullable=True),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
    )
    op.create_table('user',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=127), nullable=True),
        sa.Column('password', sa.String(length=256), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('active', sa.Boolean(), nullable=True),
        sa.Column('authenticated', sa.Boolean(), nullable=True),
        sa.Column('download_limit', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username'),
    )
    op.create_table('query',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('query', sa.Text(), nullable=True),
        sa.Column('corpus', sa.String(length=255), nullable=True),
        sa.Column('started', sa.DateTime(), nullable=True),
        sa.Column('completed', sa.DateTime(), nullable=True),
        sa.Column('aborted', sa.Boolean(), nullable=True),
        sa.Column('userID', sa.Integer(), nullable=True),
        sa.Column('transferred', sa.BigInteger(), nullable=True),
        sa.ForeignKeyConstraint(['userID'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_table('roles_users',
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('role_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['role_id'], ['role.id']),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
    )


def downgrade():
    op.drop_table('roles_users')
    op.drop_table('query')
    op.drop_table('user')
    op.drop_table('role')
