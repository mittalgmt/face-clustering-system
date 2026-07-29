"""
Image Upload Service.

Responsible for:
- Creating processing jobs
- Saving uploaded images
- Calculating SHA256 hashes
- Triggering Celery
"""

from __future__ import annotations

from django.db import transaction

from apps.face_clustering.common.hash_service import HashService
from apps.face_clustering.models.uploaded_image import UploadedImage
from apps.face_clustering.repositories.image_repository import ImageRepository
from apps.face_clustering.repositories.job_repository import JobRepository
from apps.face_clustering.tasks.processing_tasks import process_job_task


class ImageUploadService:

    def upload(self, uploaded_files):
        uploaded_files = list(uploaded_files)
        seen_hashes: set[str] = set()
        unique_files: list[tuple[object, str]] = []

        for file in uploaded_files:

            file.seek(0)

            file_bytes = file.read()

            image_hash = HashService.calculate_bytes_sha256(
                file_bytes
            )

            file.seek(0)

            if image_hash in seen_hashes:
                continue

            existing = ImageRepository.find_by_hash(image_hash)

            if existing:
                continue

            seen_hashes.add(image_hash)
            unique_files.append((file, image_hash))

        with transaction.atomic():

            job = JobRepository.create_job(
                total_images=len(unique_files)
            )

            for file, image_hash in unique_files:

                image = UploadedImage(
                    job=job,
                    image_hash=image_hash,
                )

                image.image.save(
                    file.name,
                    file,
                    save=False,
                )

                image.save()

        process_job_task.delay(str(job.id))

        return job
