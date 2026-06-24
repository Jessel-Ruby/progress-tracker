import os
from pathlib import Path
from dotenv import load_dotenv

# Load env variables
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

# Database settings
MONGODB_URL = os.getenv("MONGODB_URL")
if not MONGODB_URL or not MONGODB_URL.strip():
    raise RuntimeError(
        "MONGODB_URL is not set. Copy .env.example to .env and configure it, "
        "or set MONGODB_URL in your environment."
    )
MONGODB_URL = MONGODB_URL.strip()
DATABASE_NAME = "progress_tracker"

# Auth settings
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY or not SECRET_KEY.strip():
    raise RuntimeError(
        "SECRET_KEY is not set. Copy .env.example to .env and configure it, "
        "or set SECRET_KEY in your environment."
    )
SECRET_KEY = SECRET_KEY.strip()
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Cloudinary settings
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

if CLOUDINARY_CLOUD_NAME:
    CLOUDINARY_CLOUD_NAME = CLOUDINARY_CLOUD_NAME.strip()
if CLOUDINARY_API_KEY:
    CLOUDINARY_API_KEY = CLOUDINARY_API_KEY.strip()
if CLOUDINARY_API_SECRET:
    CLOUDINARY_API_SECRET = CLOUDINARY_API_SECRET.strip()
