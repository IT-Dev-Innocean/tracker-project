"""add_ai_conversations

Revision ID: a9e4c2b7d105
Revises: f3c8d1a6e902
Create Date: 2026-09-17 14:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from migration_helpers import table_exists

revision: str = "a9e4c2b7d105"
down_revision: Union[str, Sequence[str], None] = "f3c8d1a6e902"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if table_exists("ai_conversations"):
        return
    op.create_table(
        "ai_conversations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column("messages", sa.Text(), nullable=True),
        sa.Column("state", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ai_conversations_id"), "ai_conversations", ["id"], unique=False)
    op.create_index(
        op.f("ix_ai_conversations_username"),
        "ai_conversations",
        ["username"],
        unique=False,
    )
    op.create_index(
        op.f("ix_ai_conversations_created_at"),
        "ai_conversations",
        ["created_at"],
        unique=False,
    )
    op.create_index(
        op.f("ix_ai_conversations_updated_at"),
        "ai_conversations",
        ["updated_at"],
        unique=False,
    )
    op.create_index(
        "ix_ai_conversations_username_updated_at",
        "ai_conversations",
        ["username", "updated_at"],
        unique=False,
    )


def downgrade() -> None:
    if not table_exists("ai_conversations"):
        return
    op.drop_index("ix_ai_conversations_username_updated_at", table_name="ai_conversations")
    op.drop_index(op.f("ix_ai_conversations_updated_at"), table_name="ai_conversations")
    op.drop_index(op.f("ix_ai_conversations_created_at"), table_name="ai_conversations")
    op.drop_index(op.f("ix_ai_conversations_username"), table_name="ai_conversations")
    op.drop_index(op.f("ix_ai_conversations_id"), table_name="ai_conversations")
    op.drop_table("ai_conversations")
