"""empty message

Revision ID: 0fc41e3c59c5
Revises: 3e90c0a00e10
Create Date: 2018-12-11 10:06:14.651849

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0fc41e3c59c5'
down_revision = '3e90c0a00e10'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('user', sa.Column('is_idp_login', sa.Boolean(), nullable=True))


def downgrade():
    op.drop_column('user', 'is_idp_login')
