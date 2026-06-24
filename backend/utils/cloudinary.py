import asyncio
import io

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile

from core.config import CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

if not all([CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET]):
    raise RuntimeError(
        "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, "
        "and CLOUDINARY_API_SECRET in .env or your deployment environment."
    )

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET,
    secure=True,
)

DOCUMENT_FOLDER = "progress-tracker/documents"
VOICE_FOLDER = "progress-tracker/voice"


def _resource_type(upload_type: str) -> str:
    return "video" if upload_type == "audio" else "auto"


def _upload_sync(data: bytes, folder: str, upload_type: str) -> str:
    result = cloudinary.uploader.upload(
        io.BytesIO(data),
        folder=folder,
        resource_type=_resource_type(upload_type),
        secure=True,
    )
    return result["secure_url"]


async def upload_to_cloudinary(file: UploadFile, upload_type: str) -> str:
    folder = VOICE_FOLDER if upload_type == "audio" else DOCUMENT_FOLDER
    data = await file.read()

    try:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            None, lambda: _upload_sync(data, folder, upload_type)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Failed to upload file to cloud storage",
        ) from exc
