"""add_clients_table

Revision ID: b8d4f2a1c903
Revises: a7c3e91d2b44
Create Date: 2026-08-03 17:20:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b8d4f2a1c903"
down_revision: Union[str, Sequence[str], None] = "a7c3e91d2b44"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    if "clients" not in insp.get_table_names():
        op.create_table(
            "clients",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("client_code", sa.String(length=50), nullable=True),
            sa.Column("client_name", sa.String(length=200), nullable=True),
            sa.Column("status", sa.String(length=50), nullable=True, server_default="active"),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("created_by", sa.String(length=50), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_clients_id"), "clients", ["id"], unique=False)
        op.create_index(op.f("ix_clients_client_code"), "clients", ["client_code"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_clients_client_code"), table_name="clients")
    op.drop_index(op.f("ix_clients_id"), table_name="clients")
    op.drop_table("clients")
