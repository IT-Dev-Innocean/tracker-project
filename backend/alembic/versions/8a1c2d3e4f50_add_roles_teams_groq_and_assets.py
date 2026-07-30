"""add roles, teams, Groq ledger, and file asset metadata

Revision ID: 8a1c2d3e4f50
Revises: 01bc0511f253
Create Date: 2026-07-30
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "8a1c2d3e4f50"
down_revision: Union[str, Sequence[str], None] = "01bc0511f253"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # `setup_db()` historically calls create_all(), so a running legacy server
    # may have already created new tables while leaving old tables unaltered.
    # Keep this migration safe for both a clean schema and that partial state.
    op.add_column(
        "users",
        sa.Column(
            "system_role",
            sa.String(length=20),
            nullable=False,
            server_default="staff",
        ),
        if_not_exists=True,
    )
    op.add_column(
        "users",
        sa.Column(
            "groq_monthly_token_allowance",
            sa.Integer(),
            nullable=False,
            server_default="100000",
        ),
        if_not_exists=True,
    )
    op.execute(
        "UPDATE users SET system_role = 'admin' "
        "WHERE COALESCE(is_superadmin, 0) = 1"
    )
    op.create_index(
        "ix_users_system_role", "users", ["system_role"], if_not_exists=True
    )
    op.create_check_constraint(
        "ck_users_system_role",
        "users",
        "system_role IN ('admin', 'manager', 'staff')",
    )
    op.create_check_constraint(
        "ck_users_groq_allowance_nonnegative",
        "users",
        "groq_monthly_token_allowance >= 0",
    )

    op.create_table(
        "teams",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("name", name="uq_teams_name"),
        if_not_exists=True,
    )
    op.create_index("ix_teams_id", "teams", ["id"], if_not_exists=True)
    op.create_index("ix_teams_name", "teams", ["name"], if_not_exists=True)
    op.add_column(
        "boards",
        sa.Column("team_id", sa.Integer(), nullable=True),
        if_not_exists=True,
    )
    op.create_foreign_key(
        "fk_boards_team_id",
        "boards",
        "teams",
        ["team_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_boards_team_id", "boards", ["team_id"], if_not_exists=True
    )

    op.create_table(
        "team_memberships",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("team_id", sa.Integer(), nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column(
            "membership_role",
            sa.String(length=20),
            nullable=False,
            server_default="staff",
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["team_id"], ["teams.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["username"], ["users.username"], ondelete="CASCADE"),
        sa.UniqueConstraint("team_id", "username", name="uq_team_membership"),
        sa.CheckConstraint(
            "membership_role IN ('manager', 'staff')",
            name="ck_team_membership_role",
        ),
        if_not_exists=True,
    )
    op.create_index(
        "ix_team_memberships_id", "team_memberships", ["id"], if_not_exists=True
    )
    op.create_index(
        "ix_team_memberships_team_id",
        "team_memberships",
        ["team_id"],
        if_not_exists=True,
    )
    op.create_index(
        "ix_team_memberships_username",
        "team_memberships",
        ["username"],
        if_not_exists=True,
    )

    op.create_table(
        "groq_token_ledger",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("period", sa.String(length=7), nullable=False),
        sa.Column("prompt_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("completion_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("model", sa.String(length=100), nullable=False),
        sa.Column(
            "endpoint",
            sa.String(length=100),
            nullable=False,
            server_default="ai_generate",
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["username"], ["users.username"], ondelete="CASCADE"),
        sa.CheckConstraint(
            "prompt_tokens >= 0 AND completion_tokens >= 0 AND total_tokens >= 0",
            name="ck_groq_token_counts_nonnegative",
        ),
        if_not_exists=True,
    )
    op.create_index(
        "ix_groq_token_ledger_id",
        "groq_token_ledger",
        ["id"],
        if_not_exists=True,
    )
    op.create_index(
        "ix_groq_token_ledger_username",
        "groq_token_ledger",
        ["username"],
        if_not_exists=True,
    )
    op.create_index(
        "ix_groq_token_ledger_period",
        "groq_token_ledger",
        ["period"],
        if_not_exists=True,
    )
    op.create_index(
        "ix_groq_token_ledger_created_at",
        "groq_token_ledger",
        ["created_at"],
        if_not_exists=True,
    )
    op.create_index(
        "ix_groq_ledger_user_period",
        "groq_token_ledger",
        ["username", "period"],
        if_not_exists=True,
    )

    op.create_table(
        "file_assets",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("uploader_username", sa.String(length=50), nullable=False),
        sa.Column("request_id", sa.Integer(), nullable=True),
        sa.Column("comment_id", sa.Integer(), nullable=True),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("content_type", sa.String(length=150), nullable=True),
        sa.Column("size_bytes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "storage_kind",
            sa.String(length=30),
            nullable=False,
            server_default="metadata_only",
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["uploader_username"], ["users.username"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["request_id"], ["requests.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["comment_id"], ["comments.id"], ondelete="CASCADE"),
        sa.CheckConstraint("size_bytes >= 0", name="ck_file_asset_size_nonnegative"),
        if_not_exists=True,
    )
    op.create_index("ix_file_assets_id", "file_assets", ["id"], if_not_exists=True)
    op.create_index(
        "ix_file_assets_uploader_username",
        "file_assets",
        ["uploader_username"],
        if_not_exists=True,
    )
    op.create_index(
        "ix_file_assets_request_id",
        "file_assets",
        ["request_id"],
        if_not_exists=True,
    )
    op.create_index(
        "ix_file_assets_comment_id",
        "file_assets",
        ["comment_id"],
        if_not_exists=True,
    )


def downgrade() -> None:
    op.drop_table("file_assets")
    op.drop_table("groq_token_ledger")
    op.drop_table("team_memberships")
    op.drop_index("ix_boards_team_id", table_name="boards")
    op.drop_constraint("fk_boards_team_id", "boards", type_="foreignkey")
    op.drop_column("boards", "team_id")
    op.drop_table("teams")
    op.drop_constraint("ck_users_groq_allowance_nonnegative", "users", type_="check")
    op.drop_constraint("ck_users_system_role", "users", type_="check")
    op.drop_index("ix_users_system_role", table_name="users")
    op.drop_column("users", "groq_monthly_token_allowance")
    op.drop_column("users", "system_role")
