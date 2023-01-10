"""add_visualisation_cache

Revision ID: dc6e70d574db
Revises: d0374bca3f84
Create Date: 2022-06-08 14:44:30.037850

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'dc6e70d574db'
down_revision = 'd0374bca3f84'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('visualization',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('started', sa.DateTime()),
        sa.Column('completed', sa.DateTime(), nullable=True),
        sa.Column('corpus_name', sa.String(length=255)),
        sa.Column('visualization_type', sa.String(length=255)),
        sa.Column('parameters', sa.Text()),
        sa.Column('result', sa.Text(), nullable = True),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    op.drop_table('visualization')
