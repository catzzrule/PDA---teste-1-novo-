import uuid
from pathlib import Path

import aiofiles
from fastapi import UploadFile

from app.core.config import get_settings

settings = get_settings()

ALLOWED_CONTENT_TYPES = {
    # Word
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    # Excel / CSV
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    # PowerPoint
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    # PDF
    "application/pdf",
    # Images
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    # Video
    "video/mp4",
    "video/quicktime",
    "video/webm",
    # Audio
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
}


class UploadRejected(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class StorageBackend:
    """Abstraction over where dataset files live. The MVP implementation writes
    to local disk under STORAGE_DIR; swapping to S3/MinIO later only means
    implementing this same interface, not touching the routers."""

    async def save(self, file: UploadFile, *, subpath: str) -> tuple[str, int]:
        raise NotImplementedError

    async def open_path(self, caminho_armazenamento: str) -> Path:
        raise NotImplementedError


class LocalStorageBackend(StorageBackend):
    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    async def save(self, file: UploadFile, *, subpath: str) -> tuple[str, int]:
        if file.content_type not in ALLOWED_CONTENT_TYPES:
            raise UploadRejected(f"Tipo de arquivo não permitido: {file.content_type}")

        safe_name = "".join(c if c.isalnum() or c in "._-" else "_" for c in (file.filename or "arquivo"))
        relative_path = Path(subpath) / f"{uuid.uuid4().hex}-{safe_name}"
        full_path = self.base_dir / relative_path
        full_path.parent.mkdir(parents=True, exist_ok=True)

        max_bytes = settings.max_upload_mb * 1024 * 1024
        size = 0
        async with aiofiles.open(full_path, "wb") as out:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > max_bytes:
                    await out.close()
                    full_path.unlink(missing_ok=True)
                    raise UploadRejected(f"Arquivo excede o limite de {settings.max_upload_mb}MB")
                await out.write(chunk)

        return str(relative_path), size

    async def open_path(self, caminho_armazenamento: str) -> Path:
        return self.base_dir / caminho_armazenamento


storage_backend = LocalStorageBackend(settings.storage_dir)
