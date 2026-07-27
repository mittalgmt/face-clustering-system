"""
Repository for UploadedImage.
"""

from __future__ import annotations

from typing import Optional

from django.db import transaction

from apps.face_clustering.models.uploaded_image import (
    UploadedImage,
)
from apps.face_clustering.models.processing_job import (
    ProcessingJob,
)


class ImageRepository:

    @staticmethod
    @transaction.atomic
    def create(
        *,
        job: ProcessingJob,
        image,
        image_hash: str,
    ) -> UploadedImage:

        return UploadedImage.objects.create(
            job=job,
            image=image,
            image_hash=image_hash,
        )

    @staticmethod
    def find_by_hash(
        image_hash: str,
    ) -> Optional[UploadedImage]:

        return (
            UploadedImage.objects
            .filter(image_hash=image_hash)
            .first()
        )

    @staticmethod
    def get_by_job(
        job: ProcessingJob,
    ):

        return (
            UploadedImage.objects
            .filter(job=job)
            .order_by("created_at")
        )

    @staticmethod
    def save(
        image: UploadedImage,
    ) -> None:

        image.save()

    @staticmethod
    def delete(
        image: UploadedImage,
    ) -> None:

        image.delete()

    @staticmethod
    def completed_images(
        job: ProcessingJob,
    ):

        return (
            UploadedImage.objects
            .filter(
                job=job,
                processing_status="COMPLETED",
            )
        )