"""
Hash Service

Generates SHA256 hashes for uploaded images.
"""

from __future__ import annotations

import hashlib
from pathlib import Path


class HashService:
    """
    Generate SHA256 hashes for duplicate detection.
    """

    CHUNK_SIZE = 8192

    @classmethod
    def calculate_sha256(cls, file_path: str | Path) -> str:
        """
        Calculate SHA256 hash of a file.
        """
        sha = hashlib.sha256()

        with open(file_path, "rb") as image_file:
            while chunk := image_file.read(cls.CHUNK_SIZE):
                sha.update(chunk)

        return sha.hexdigest()

    @classmethod
    def calculate_bytes_sha256(cls, file_bytes: bytes) -> str:
        """
        Calculate SHA256 from raw bytes.
        """
        return hashlib.sha256(file_bytes).hexdigest()