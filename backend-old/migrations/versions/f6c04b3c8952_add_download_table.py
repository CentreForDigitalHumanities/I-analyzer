"""Add download table

Revision ID: f6c04b3c8952
Revises: dc6e70d574db
Create Date: 2022-11-01 11:28:24.373921

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f6c04b3c8952'
down_revision = 'dc6e70d574db'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('download',
        sa.Column('id', sa.Integer(), autoincrement=True),
        sa.Column('started', sa.DateTime(), nullable=False),
        sa.Column('completed', sa.DateTime()),
        sa.Column('download_type', sa.String(254), nullable=False),
        sa.Column('corpus_name', sa.String(254), nullable=False),
        sa.Column('user_id', sa.Integer()),
        sa.Column('parameters', sa.Text(), nullable=False),
        sa.Column('filename', sa.String(254)),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )

def downgrade():
    op.drop_table('download')
