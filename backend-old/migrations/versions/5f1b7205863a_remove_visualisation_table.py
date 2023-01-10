"""remove visualisation table

Revision ID: 5f1b7205863a
Revises: f6c04b3c8952
Create Date: 2022-11-16 14:44:22.081242

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '5f1b7205863a'
down_revision = 'f6c04b3c8952'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_table('visualization')


def downgrade():
    op.create_table('visualization',
        sa.Column('id', mysql.INTEGER(), autoincrement=True, nullable=False),
        sa.Column('started', mysql.DATETIME(), nullable=True),
        sa.Column('completed', mysql.DATETIME(), nullable=True),
        sa.Column('corpus_name', mysql.VARCHAR(length=255), nullable=True),
        sa.Column('visualization_type', mysql.VARCHAR(length=255), nullable=True),
        sa.Column('parameters', mysql.TEXT(), nullable=True),
        sa.Column('result', mysql.TEXT(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
