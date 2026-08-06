"""Add SecurityLog table

Revision ID: 5bad02e9bf55
Revises: c9466707a980
Create Date: 2026-06-20 00:24:46.318157

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from migration_helpers import (
    column_is_text,
    drop_column_if_exists,
    drop_constraint_if_exists,
)

# revision identifiers, used by Alembic.
revision: str = "5bad02e9bf55"
down_revision: Union[str, Sequence[str], None] = "c9466707a980"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "security_logs",
        sa.Column("key", sa.String(length=255), nullable=False),
        sa.Column("value", sa.Text(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("key"),
    )
    op.create_index(op.f("ix_security_logs_key"), "security_logs", ["key"], unique=False)

    # DB lama punya unique constraint ini; baseline/fresh DB tidak
    drop_constraint_if_exists("requests_timestamp_key", "requests")

    if column_is_text("subtasks", "assignee"):
        op.alter_column(
            "subtasks",
            "assignee",
            existing_type=sa.TEXT(),
            type_=sa.String(length=50),
            existing_nullable=True,
        )

    if column_is_text("users", "account_status"):
        op.alter_column(
            "users",
            "account_status",
            existing_type=sa.TEXT(),
            type_=sa.String(length=50),
            existing_nullable=True,
            existing_server_default=sa.text("'active'::text"),
        )

    drop_column_if_exists("users", "tier")


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_security_logs_key"), table_name="security_logs")
    op.drop_table("security_logs")
    op.add_column("users", sa.Column("tier", sa.VARCHAR(length=20), autoincrement=False, nullable=True))
    op.alter_column(
        "users",
        "account_status",
        existing_type=sa.String(length=50),
        type_=sa.TEXT(),
        existing_nullable=True,
        existing_server_default=sa.text("'active'::text"),
    )
    op.alter_column(
        "subtasks",
        "assignee",
        existing_type=sa.String(length=50),
        type_=sa.TEXT(),
        existing_nullable=True,
    )
    op.create_unique_constraint(
        op.f("requests_timestamp_key"),
        "requests",
        ["timestamp"],
        postgresql_nulls_not_distinct=False,
    )
