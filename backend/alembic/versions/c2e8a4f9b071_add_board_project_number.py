"""add_board_project_number

Revision ID: c2e8a4f9b071
Revises: b8d4f2a1c903
Create Date: 2026-08-04 16:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c2e8a4f9b071"
down_revision: Union[str, Sequence[str], None] = "b8d4f2a1c903"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "boards",
        sa.Column("project_number", sa.String(length=100), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("boards", "project_number")
