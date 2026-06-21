from fastapi import HTTPException, UploadFile

ALLOWED_DOCUMENT_MIME_TYPES = frozenset({
    "application/pdf",
    "image/png",
    "image/jpeg",
    "application/msword",
    "text/plain",
})

ALLOWED_AUDIO_MIME_TYPES = frozenset({
    "audio/mpeg",
    "audio/wav",
    "audio/webm",
})


def _normalize_content_type(file: UploadFile) -> str:
    return (file.content_type or "").split(";")[0].strip().lower()


def validate_upload_mime(file: UploadFile, allowed_types: frozenset, category: str) -> None:
    content_type = _normalize_content_type(file)
    if content_type not in allowed_types:
        allowed_list = ", ".join(sorted(allowed_types))
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported {category} file type"
                f"{f': {content_type}' if content_type else ''}. "
                f"Allowed types: {allowed_list}"
            ),
        )


def validate_document_upload(file: UploadFile) -> None:
    validate_upload_mime(file, ALLOWED_DOCUMENT_MIME_TYPES, "document")


def validate_audio_upload(file: UploadFile) -> None:
    validate_upload_mime(file, ALLOWED_AUDIO_MIME_TYPES, "audio")
