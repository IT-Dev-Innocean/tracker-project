"""extend_ai_usage_tracking

Revision ID: b7e1c4d8f201
Revises: a9e4c2b7d105
Create Date: 2026-09-18 16:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from migration_helpers import column_exists, table_exists

revision: str = "b7e1c4d8f201"
down_revision: Union[str, Sequence[str], None] = "a9e4c2b7d105"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if table_exists("ai_usage_logs"):
        columns = [
            ("request_id", sa.Column("request_id", sa.String(length=64), nullable=True)),
            ("task_type", sa.Column("task_type", sa.String(length=64), nullable=True)),
            ("model", sa.Column("model", sa.String(length=80), nullable=True)),
            ("input_tokens", sa.Column("input_tokens", sa.Integer(), nullable=True)),
            ("output_tokens", sa.Column("output_tokens", sa.Integer(), nullable=True)),
            (
                "cached_input_tokens",
                sa.Column("cached_input_tokens", sa.Integer(), nullable=True),
            ),
            ("estimated_cost", sa.Column("estimated_cost", sa.Float(), nullable=True)),
            ("error_type", sa.Column("error_type", sa.String(length=40), nullable=True)),
            ("latency_ms", sa.Column("latency_ms", sa.Integer(), nullable=True)),
            (
                "counts_as_prompt",
                sa.Column("counts_as_prompt", sa.Integer(), nullable=True),
            ),
        ]
        for name, col in columns:
            if not column_exists("ai_usage_logs", name):
                op.add_column("ai_usage_logs", col)
        bind = op.get_bind()
        inspector = sa.inspect(bind)
        existing = {idx["name"] for idx in inspector.get_indexes("ai_usage_logs")}
        if "ix_ai_usage_logs_request_id" not in existing:
            op.create_index("ix_ai_usage_logs_request_id", "ai_usage_logs", ["request_id"])
        if "ix_ai_usage_logs_created_provider" not in existing:
            op.create_index(
                "ix_ai_usage_logs_created_provider",
                "ai_usage_logs",
                ["created_at", "provider_used"],
            )
        if "ix_ai_usage_logs_created_task_type" not in existing:
            op.create_index(
                "ix_ai_usage_logs_created_task_type",
                "ai_usage_logs",
                ["created_at", "task_type"],
            )
        if "ix_ai_usage_logs_created_status" not in existing:
            op.create_index(
                "ix_ai_usage_logs_created_status",
                "ai_usage_logs",
                ["created_at", "status"],
            )

    if not table_exists("ai_user_daily_usage"):
        op.create_table(
            "ai_user_daily_usage",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("username", sa.String(length=50), nullable=False),
            sa.Column("usage_date", sa.String(length=10), nullable=False),
            sa.Column("prompt_count", sa.Integer(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("username", "usage_date", name="uq_ai_user_daily_usage_user_date"),
        )
        op.create_index(
            "ix_ai_user_daily_usage_date", "ai_user_daily_usage", ["usage_date"], unique=False
        )
        op.create_index(op.f("ix_ai_user_daily_usage_id"), "ai_user_daily_usage", ["id"], unique=False)

    if not table_exists("ai_usage_daily_stats"):
        op.create_table(
            "ai_usage_daily_stats",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("usage_date", sa.String(length=10), nullable=False),
            sa.Column("provider", sa.String(length=32), nullable=False),
            sa.Column("task_type", sa.String(length=64), nullable=False),
            sa.Column("request_count", sa.Integer(), nullable=True),
            sa.Column("prompt_count", sa.Integer(), nullable=True),
            sa.Column("input_tokens", sa.Integer(), nullable=True),
            sa.Column("output_tokens", sa.Integer(), nullable=True),
            sa.Column("cached_input_tokens", sa.Integer(), nullable=True),
            sa.Column("estimated_cost", sa.Float(), nullable=True),
            sa.Column("error_count", sa.Integer(), nullable=True),
            sa.Column("rate_limit_count", sa.Integer(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint(
                "usage_date",
                "provider",
                "task_type",
                name="uq_ai_usage_daily_stats_date_provider_task",
            ),
        )
        op.create_index(
            "ix_ai_usage_daily_stats_date", "ai_usage_daily_stats", ["usage_date"], unique=False
        )
        op.create_index(op.f("ix_ai_usage_daily_stats_id"), "ai_usage_daily_stats", ["id"], unique=False)


def downgrade() -> None:
    if table_exists("ai_usage_daily_stats"):
        op.drop_index("ix_ai_usage_daily_stats_date", table_name="ai_usage_daily_stats")
        op.drop_index(op.f("ix_ai_usage_daily_stats_id"), table_name="ai_usage_daily_stats")
        op.drop_table("ai_usage_daily_stats")
    if table_exists("ai_user_daily_usage"):
        op.drop_index("ix_ai_user_daily_usage_date", table_name="ai_user_daily_usage")
        op.drop_index(op.f("ix_ai_user_daily_usage_id"), table_name="ai_user_daily_usage")
        op.drop_table("ai_user_daily_usage")
