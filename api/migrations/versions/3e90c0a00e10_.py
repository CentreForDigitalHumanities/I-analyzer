"""empty message

Revision ID: 3e90c0a00e10
Revises: 361d399102d9
Create Date: 2018-10-24 11:02:09.288795

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3e90c0a00e10'
down_revision = '361d399102d9'
branch_labels = None
depends_on = None


role = sa.sql.table(
        'role',
        sa.Column('id', sa.Integer(), autoincrement=True),
        sa.Column('name', sa.String(length=80), nullable=True),
        sa.Column('description', sa.String(length=255), nullable=True), 
    )

corpus = sa.sql.table(
        'corpus',
        sa.Column('id', sa.Integer(), autoincrement=True),
        sa.Column('name', sa.String(length=80), nullable=True),
        sa.Column('description', sa.String(length=255), nullable=True), 
    )


def upgrade():
   
    op.bulk_insert(role,
        [
            { 'name':'basic', 'description': 'corpora for public access'},
           
        ]
    )

    op.bulk_insert(corpus,
        [
            { 'name':'times', 'description': 'Newspaper Times'},
            { 'name':'tml', 'description': 'music corpus'},
            { 'name':'dutchbanking', 'description': 'Dutch Banking'},
        ]
    )


def downgrade():
    op.execute(
        corpus.delete().where(corpus.c.name.in_(('times','tml','dutchbanking')))   
    )
    op.execute(
        role.delete().where(role.c.name=='basic')
    )

