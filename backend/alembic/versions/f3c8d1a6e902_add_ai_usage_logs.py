"""add_ai_usage_logs

Revision ID: f3c8d1a6e902
Revises: e4b9f6c2a810
Create Date: 2026-09-17 11:20:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from migration_helpers import table_exists

revision: str = "f3c8d1a6e902"
down_revision: Union[str, Sequence[str], None] = "e4b9f6c2a810"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if table_exists("ai_usage_logs"):
        return
    op.create_table(
        "ai_usage_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("success", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=True),
        sa.Column("provider_used", sa.String(length=20), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ai_usage_logs_id"), "ai_usage_logs", ["id"], unique=False)
    op.create_index(
        op.f("ix_ai_usage_logs_username"),
        "ai_usage_logs",
        ["username"],
        unique=False,
    )
    op.create_index(
        op.f("ix_ai_usage_logs_created_at"),
        "ai_usage_logs",
        ["created_at"],
        unique=False,
    )
    op.create_index(
        "ix_ai_usage_logs_username_created_at",
        "ai_usage_logs",
        ["username", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    if not table_exists("ai_usage_logs"):
        return
    op.drop_index("ix_ai_usage_logs_username_created_at", table_name="ai_usage_logs")
    op.drop_index(op.f("ix_ai_usage_logs_created_at"), table_name="ai_usage_logs")
    op.drop_index(op.f("ix_ai_usage_logs_username"), table_name="ai_usage_logs")
    op.drop_index(op.f("ix_ai_usage_logs_id"), table_name="ai_usage_logs")
    op.drop_table("ai_usage_logs")
