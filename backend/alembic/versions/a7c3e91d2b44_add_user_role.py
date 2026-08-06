"""add_user_role

Revision ID: a7c3e91d2b44
Revises: 01bc0511f253
Create Date: 2026-07-31 13:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from migration_helpers import column_exists


revision: str = "a7c3e91d2b44"
down_revision: Union[str, Sequence[str], None] = "01bc0511f253"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not column_exists("users", "role"):
        op.add_column(
            "users",
            sa.Column("role", sa.String(length=50), nullable=True, server_default="project_owner"),
        )
    # Backfill: superadmins become admin, everyone else project_owner
    op.execute(
        """
        UPDATE users
        SET role = CASE
            WHEN is_superadmin = 1 THEN 'admin'
            ELSE 'project_owner'
        END
        WHERE role IS NULL OR role = '' OR role NOT IN ('admin', 'project_owner', 'manager', 'staff')
        """
    )


def downgrade() -> None:
    op.drop_column("users", "role")
