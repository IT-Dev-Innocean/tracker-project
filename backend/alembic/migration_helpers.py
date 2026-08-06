"""Helper idempotent untuk migrasi Alembic (fresh DB vs DB lama)."""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect


def drop_constraint_if_exists(name: str, table: str) -> None:
    op.execute(sa.text(f'ALTER TABLE "{table}" DROP CONSTRAINT IF EXISTS "{name}"'))


def drop_column_if_exists(table: str, column: str) -> None:
    bind = op.get_bind()
    cols = {c["name"] for c in inspect(bind).get_columns(table)}
    if column in cols:
        op.drop_column(table, column)


def table_exists(table: str) -> bool:
    bind = op.get_bind()
    return table in inspect(bind).get_table_names()


def column_exists(table: str, column: str) -> bool:
    if not table_exists(table):
        return False
    bind = op.get_bind()
    return column in {c["name"] for c in inspect(bind).get_columns(table)}


def column_is_text(table: str, column: str) -> bool:
    bind = op.get_bind()
    for col in inspect(bind).get_columns(table):
        if col["name"] == column:
            type_name = type(col["type"]).__name__.upper()
            return type_name == "TEXT" or "TEXT" in str(col["type"]).upper()
    return False
