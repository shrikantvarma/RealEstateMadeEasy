"""Widen sessions.summary from VARCHAR(255) to TEXT

Revision ID: 002
Revises: 001
Create Date: 2026-02-07
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "sessions",
        "summary",
        existing_type=sa.String(255),
        type_=sa.Text(),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "sessions",
        "summary",
        existing_type=sa.Text(),
        type_=sa.String(255),
        existing_nullable=True,
    )
