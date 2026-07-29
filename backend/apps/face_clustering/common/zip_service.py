"""
ZIP Extraction Service.
"""

from __future__ import annotations

import shutil
import uuid
import zipfile
from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile


class ZipService:

    ALLOWED_EXTENSIONS = {
        ".jpg",
        ".jpeg",
        ".png",
        ".bmp",
        ".webp",
    }

    def __init__(self):
        self.extract_path: Path | None = None

    def extract(self, uploaded_zip):
        uploaded_zip.seek(0)

        if not zipfile.is_zipfile(uploaded_zip):
            raise ValueError("Uploaded file is not a valid ZIP archive.")

        uploaded_zip.seek(0)

        temp_root = Path(settings.MEDIA_ROOT) / "temp"

        temp_root.mkdir(parents=True, exist_ok=True)

        self.extract_path = temp_root / uuid.uuid4().hex

        self.extract_path.mkdir(parents=True, exist_ok=True)

        with zipfile.ZipFile(uploaded_zip, "r") as zip_ref:
            zip_ref.extractall(self.extract_path)

        return self.extract_path

    def get_image_files(self):

        if self.extract_path is None:
            raise ValueError("ZIP has not been extracted.")

        files = []

        for image_path in self.extract_path.rglob("*"):

            if (
                image_path.is_file()
                and image_path.suffix.lower() in self.ALLOWED_EXTENSIONS
            ):
                with image_path.open("rb") as image_file:
                    content = ContentFile(image_file.read())
                    content.name = image_path.name
                    files.append(content)

        return files

    def cleanup(self):

        if self.extract_path and self.extract_path.exists():
            shutil.rmtree(self.extract_path)
            self.extract_path = None
