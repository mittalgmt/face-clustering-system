from __future__ import annotations

from typing import Iterable

from django.db import transaction

from apps.face_clustering.models.processing_job import ProcessingJob
from apps.face_clustering.models.uploaded_image import UploadedImage


class ImageRepository:
    """Repository for UploadedImage database operations."""

    @staticmethod
    def bulk_create(
        images: Iterable[UploadedImage],
    ) -> list[UploadedImage]:
        """
        Bulk insert uploaded images.
        """
        with transaction.atomic():
            return UploadedImage.objects.bulk_create(images)

    @staticmethod
    def get_by_job(
        job: ProcessingJob,
    ):
        """
        Get all images belonging to a job.
        """
        return (
            UploadedImage.objects
            .filter(job=job)
            .order_by("created_at")
        )

    @staticmethod
    def get_by_id(image_id):
        """
        Get image by id.
        """
        try:
            return UploadedImage.objects.get(id=image_id)
        except UploadedImage.DoesNotExist:
            return None

    @staticmethod
    def save(image: UploadedImage):
        """
        Save image changes.
        """
        image.save()
        return image

    @staticmethod
    def bulk_update(
        images: list[UploadedImage],
        fields: list[str],
    ):
        """
        Bulk update images.
        """
        with transaction.atomic():
            UploadedImage.objects.bulk_update(
                images,
                fields,
            )