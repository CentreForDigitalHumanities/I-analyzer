"""made email unique field in user table

Revision ID: 1daf6ab66e39
Revises: 3e90c0a00e10
Create Date: 2019-03-14 16:29:49.594346

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1daf6ab66e39'
down_revision = '3e90c0a00e10'
branch_labels = None
depends_on = None


def upgrade():
    op.create_unique_constraint('uniqemail', 'user', ['email'])


def downgrade():
    op.drop_constraint('uniqemail', 'user', type_='unique')
