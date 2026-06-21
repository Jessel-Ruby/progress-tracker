import os
from pathlib import Path

import motor.motor_asyncio
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

MONGODB_URL = os.getenv("MONGODB_URL")
if not MONGODB_URL or not MONGODB_URL.strip():
    raise RuntimeError(
        "MONGODB_URL is not set. Copy .env.example to .env and configure it, "
        "or set MONGODB_URL in your environment (e.g. Render dashboard)."
    )

DATABASE_NAME = "progress_tracker"

client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL.strip())
db = client[DATABASE_NAME]
