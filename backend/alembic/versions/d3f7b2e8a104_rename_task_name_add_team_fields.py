"""rename project_name to task_name and add team fields

Revision ID: d3f7b2e8a104
Revises: c2e8a4f9b071
Create Date: 2026-08-07 01:55:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from migration_helpers import column_exists

revision: str = "d3f7b2e8a104"
down_revision: Union[str, Sequence[str], None] = "c2e8a4f9b071"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if column_exists("requests", "project_name"):
        op.alter_column("requests", "project_name", new_column_name="task_name")
    if not column_exists("requests", "head_of_project"):
        op.add_column("requests", sa.Column("head_of_project", sa.Text(), nullable=True))
    if not column_exists("requests", "rc_team"):
        op.add_column("requests", sa.Column("rc_team", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("requests", "rc_team")
    op.drop_column("requests", "head_of_project")
    op.alter_column("requests", "task_name", new_column_name="project_name")
