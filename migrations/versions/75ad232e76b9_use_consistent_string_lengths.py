"""Use consistent string lengths

Revision ID: 75ad232e76b9
Revises: a5ce6a370720
Create Date: 2017-07-27 17:51:39.131646

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '75ad232e76b9'
down_revision = 'a5ce6a370720'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        'query',
        'corpus',
        existing_type=sa.String(length=255),
        type_=sa.String(length=254),
        existing_nullable=True,
    )
    op.alter_column(
        'role',
        'description',
        existing_type=sa.String(length=255),
        type_=sa.String(length=254),
        existing_nullable=True,
    )
    op.alter_column(
        'role',
        'name',
        existing_type=sa.String(length=80),
        type_=sa.String(length=126),
        existing_nullable=True,
    )
    op.alter_column(
        'user',
        'email',
        existing_type=sa.String(length=255),
        type_=sa.String(length=254),
        existing_nullable=True,
    )
    op.alter_column(
        'user',
        'password',
        existing_type=sa.String(length=256),
        type_=sa.String(length=254),
        existing_nullable=True,
    )
    op.alter_column(
        'user',
        'username',
        existing_type=sa.String(length=127),
        type_=sa.String(length=126),
        existing_nullable=True,
    )


def downgrade():
    op.alter_column(
        'user',
        'username',
        existing_type=sa.String(length=126),
        type_=sa.String(length=127),
        existing_nullable=True,
    )
    op.alter_column(
        'user',
        'password',
        existing_type=sa.String(length=254),
        type_=sa.String(length=256),
        existing_nullable=True,
    )
    op.alter_column(
        'user',
        'email',
        existing_type=sa.String(length=254),
        type_=sa.String(length=255),
        existing_nullable=True,
    )
    op.alter_column(
        'role',
        'name',
        existing_type=sa.String(length=126),
        type_=sa.String(length=80),
        existing_nullable=True,
    )
    op.alter_column(
        'role',
        'description',
        existing_type=sa.String(length=254),
        type_=sa.String(length=255),
        existing_nullable=True,
    )
    op.alter_column(
        'query',
        'corpus',
        existing_type=sa.String(length=254),
        type_=sa.String(length=255),
        existing_nullable=True,
    )
