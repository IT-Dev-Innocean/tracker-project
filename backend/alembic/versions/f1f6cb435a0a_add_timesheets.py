"""Add timesheets

Revision ID: f1f6cb435a0a
Revises: 5bad02e9bf55
Create Date: 2026-07-16 14:01:26.991446

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from migration_helpers import (
    column_exists,
    column_is_text,
    drop_column_if_exists,
    drop_constraint_if_exists,
    table_exists,
)

# revision identifiers, used by Alembic.
revision: str = "f1f6cb435a0a"
down_revision: Union[str, Sequence[str], None] = "5bad02e9bf55"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    drop_constraint_if_exists("requests_timestamp_key", "requests")

    if column_is_text("subtasks", "assignee"):
        op.alter_column(
            "subtasks",
            "assignee",
            existing_type=sa.TEXT(),
            type_=sa.String(length=50),
            existing_nullable=True,
        )

    if not column_exists("users", "timesheet_approver"):
        op.add_column("users", sa.Column("timesheet_approver", sa.String(length=50), nullable=True))

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

    # Tabel timesheets belum ada di baseline — buat jika fresh install
    if not table_exists("timesheets"):
        op.create_table(
            "timesheets",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_username", sa.String(length=50), nullable=True),
            sa.Column("request_id", sa.Integer(), nullable=True),
            sa.Column("board_id", sa.Integer(), nullable=True),
            sa.Column("date", sa.DateTime(), nullable=True),
            sa.Column("hours_logged", sa.Float(), nullable=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("status", sa.String(length=50), nullable=True),
            sa.Column("approver_username", sa.String(length=50), nullable=True),
            sa.Column("timestamp", sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_timesheets_id"), "timesheets", ["id"], unique=False)
        op.create_index(op.f("ix_timesheets_user_username"), "timesheets", ["user_username"], unique=False)
        op.create_index(op.f("ix_timesheets_request_id"), "timesheets", ["request_id"], unique=False)
        op.create_index(op.f("ix_timesheets_board_id"), "timesheets", ["board_id"], unique=False)
        op.create_index(op.f("ix_timesheets_date"), "timesheets", ["date"], unique=False)
        op.create_index(op.f("ix_timesheets_approver_username"), "timesheets", ["approver_username"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    if table_exists("timesheets"):
        op.drop_index(op.f("ix_timesheets_approver_username"), table_name="timesheets")
        op.drop_index(op.f("ix_timesheets_date"), table_name="timesheets")
        op.drop_index(op.f("ix_timesheets_board_id"), table_name="timesheets")
        op.drop_index(op.f("ix_timesheets_request_id"), table_name="timesheets")
        op.drop_index(op.f("ix_timesheets_user_username"), table_name="timesheets")
        op.drop_index(op.f("ix_timesheets_id"), table_name="timesheets")
        op.drop_table("timesheets")

    op.add_column("users", sa.Column("tier", sa.VARCHAR(length=20), autoincrement=False, nullable=True))
    op.alter_column(
        "users",
        "account_status",
        existing_type=sa.String(length=50),
        type_=sa.TEXT(),
        existing_nullable=True,
        existing_server_default=sa.text("'active'::text"),
    )
    op.drop_column("users", "timesheet_approver")
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
