"""add is_started to subtasks

Revision ID: e4b9f6c2a810
Revises: d3f7b2e8a104
Create Date: 2026-09-16 14:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from migration_helpers import column_exists

revision: str = "e4b9f6c2a810"
down_revision: Union[str, Sequence[str], None] = "d3f7b2e8a104"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not column_exists("subtasks", "is_started"):
        op.add_column(
            "subtasks",
            sa.Column("is_started", sa.Integer(), nullable=True, server_default="0"),
        )


def downgrade() -> None:
    if column_exists("subtasks", "is_started"):
        op.drop_column("subtasks", "is_started")
