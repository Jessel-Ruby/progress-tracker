from pathlib import PurePosixPath
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

# Extensions allowed for document/CAD uploads (lowercase, with leading dot).
# Many engineering formats lack standardised MIME types and browsers commonly
# report them as "application/octet-stream", so extension acts as a fallback.
ALLOWED_DOCUMENT_EXTENSIONS = frozenset({
    # Standard office / document formats
    ".pdf", ".png", ".jpg", ".jpeg",
    ".doc", ".docx",
    ".txt",
    ".xls", ".xlsx",
    ".ppt", ".pptx",
    ".csv",
    # SolidWorks
    ".sldprt", ".sldasm", ".slddrw",
    # Neutral CAD exchange formats
    ".step", ".stp", ".iges", ".igs",
    # AutoCAD
    ".dwg", ".dxf",
    # ANSYS result / input files
    ".rst", ".cdb", ".ansys", ".inp",
    # Lotus 1-2-3 (legacy spreadsheets)
    ".123", ".wk1", ".wk3", ".wks",
    # Compressed archives (CAD packages)
    ".zip", ".rar", ".7z",
    # ShrinkIt archive
    ".shk",
})


def _normalize_content_type(file: UploadFile) -> str:
    """Return the base MIME type, stripped of parameters and lowercased."""
    return (file.content_type or "").split(";")[0].strip().lower()


def _get_extension(file: UploadFile) -> str:
    """Return the lowercase file extension (including leading dot), or '' if none."""
    if not file.filename:
        return ""
    return PurePosixPath(file.filename).suffix.lower()


def validate_upload_mime(
    file: UploadFile,
    allowed_types: frozenset,
    category: str,
    allowed_extensions: frozenset | None = None,
) -> None:
    """Raise HTTP 400 unless the file passes at least one of:
    - MIME-type check  (content_type is in *allowed_types*), or
    - Extension check  (file extension is in *allowed_extensions*, when provided).
    """
    content_type = _normalize_content_type(file)
    mime_ok = content_type in allowed_types

    ext = _get_extension(file)
    ext_ok = bool(allowed_extensions) and (ext in allowed_extensions)

    if mime_ok or ext_ok:
        return  # at least one check passed

    # Build a detailed rejection message.
    type_detail = content_type if content_type else "<none>"
    ext_detail = ext if ext else "<none>"
    allowed_mime_list = ", ".join(sorted(allowed_types))
    ext_note = (
        f" Allowed extensions: {', '.join(sorted(allowed_extensions))}."
        if allowed_extensions
        else ""
    )
    raise HTTPException(
        status_code=400,
        detail=(
            f"Unsupported {category} file. "
            f"Received content-type '{type_detail}' and extension '{ext_detail}'. "
            f"Allowed MIME types: {allowed_mime_list}.{ext_note}"
        ),
    )


def validate_document_upload(file: UploadFile) -> None:
    """Accept documents by MIME type OR by recognised extension (CAD fallback)."""
    validate_upload_mime(
        file,
        ALLOWED_DOCUMENT_MIME_TYPES,
        "document",
        allowed_extensions=ALLOWED_DOCUMENT_EXTENSIONS,
    )


def validate_audio_upload(file: UploadFile) -> None:
    """Accept audio files by MIME type only (no extension fallback)."""
    validate_upload_mime(file, ALLOWED_AUDIO_MIME_TYPES, "audio")
