"""empty message

Revision ID: 361d399102d9
Revises: b96a734631cb
Create Date: 2018-10-23 16:15:35.179672

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '361d399102d9'
down_revision = 'b96a734631cb'
branch_labels = None
depends_on = None


def upgrade():
  
    op.create_table('corpus',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=126), nullable=True),
        sa.Column('description', sa.String(length=254), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_table('corpora_roles',
        sa.Column('role_id', sa.Integer(), nullable=True),
        sa.Column('corpus_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['corpus_id'], ['corpus.id'], ),
        sa.ForeignKeyConstraint(['role_id'], ['role.id'], )
    )
    op.drop_table('roles_users')
    op.add_column('user', sa.Column('role_id', sa.Integer(), nullable=True))
    op.create_foreign_key('roles_users_ibfk_1', 'user', 'role', ['role_id'], ['id'])
    


def downgrade():
  
    op.drop_constraint('roles_users_ibfk_1', 'user', type_='foreignkey')
    op.drop_column('user', 'role_id')
    op.create_table('roles_users',
        sa.Column('user_id', sa.Integer(), autoincrement=False, nullable=True),
        sa.Column('role_id', sa.Integer(), autoincrement=False, nullable=True),
        sa.ForeignKeyConstraint(['role_id'], ['role.id'], name='roles_users_ibfk_1'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], name='roles_users_ibfk_2'),
       
    )
    op.drop_table('corpora_roles')
    op.drop_table('corpus')
 
