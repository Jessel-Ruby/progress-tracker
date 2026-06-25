"""
Shared database initialization helper for maintenance scripts.

Usage:
    from scripts._db_helper import init_db

    async def main():
        await init_db()
        # ... use Beanie models normally ...
"""
import sys
from pathlib import Path

# Ensure the backend directory is on sys.path so that
# `import models`, `from core.database import db`, etc. work
# regardless of where the script is invoked from.
_backend_dir = str(Path(__file__).resolve().parent.parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from beanie import init_beanie
from core.database import db
import models

ALL_DOCUMENT_MODELS = [
    models.User,
    models.Task,
    models.TaskSubmission,
    models.ActivityLog,
    models.Notification,
    models.Department,
]


async def init_db():
    """Initialize Beanie with all document models."""
    await init_beanie(database=db, document_models=ALL_DOCUMENT_MODELS)
