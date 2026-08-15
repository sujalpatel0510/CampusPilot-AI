"""Initial schema.

The full schema is generated directly from the SQLAlchemy models via
`Base.metadata.create_all` / `drop_all`. This keeps the migration perfectly in
sync with the application models by construction and is a deliberate choice for
a greenfield project.

Revision ID: 0001_initial
Revises:
Create Date: 2026-08-15

"""
from alembic import op

from app.core.database import Base
from app import models  # noqa: F401  ensure every model is imported

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
