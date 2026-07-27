"""
Duplicate Detection Service.
"""

from __future__ import annotations

from dataclasses import dataclass

from apps.face_clustering.models.uploaded_image import UploadedImage
from apps.face_clustering.repositories.image_repository import ImageRepository


@dataclass(slots=True)
class DuplicateResult:
    """
    Result returned after duplicate lookup.
    """

    is_duplicate: bool
    existing_image: UploadedImage | None


class DuplicateService:
    """
    Handles duplicate image detection.
    """

    def __init__(
        self,
        image_repository: ImageRepository,
    ) -> None:

        self.image_repository = image_repository

    def check_duplicate(
        self,
        image_hash: str,
    ) -> DuplicateResult:

        existing = self.image_repository.find_by_hash(image_hash)

        if existing is None:
            return DuplicateResult(False, None)

        return DuplicateResult(True, existing)

    def reuse_embedding(
        self,
        *,
        source: UploadedImage,
        target: UploadedImage,
    ) -> None:
        """
        Copy embedding from existing image.
        """

        target.embedding = source.embedding
        target.face_detected = source.face_detected
        target.duplicate = True

        self.image_repository.save(target)