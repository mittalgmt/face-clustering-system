"""
ZIP Upload Service.

Responsible for:
- Extract ZIP archive
- Create processing job
- Save uploaded images
- Calculate SHA256 hashes
- Trigger Celery processing
"""

from __future__ import annotations

from django.db import transaction

from apps.face_clustering.common.hash_service import HashService
from apps.face_clustering.common.zip_service import ZipService
from apps.face_clustering.models.uploaded_image import UploadedImage
from apps.face_clustering.repositories.image_repository import ImageRepository
from apps.face_clustering.repositories.job_repository import JobRepository
from apps.face_clustering.tasks.processing_tasks import process_job_task


class ZipUploadService:

    def upload(self, uploaded_zip):

        zip_service = ZipService()

        try:

            zip_service.extract(uploaded_zip)

            image_files = zip_service.get_image_files()

            if not image_files:
                raise ValueError(
                    "No supported images found inside ZIP."
                )

            unique_files: list[tuple[object, str]] = []
            seen_hashes: set[str] = set()

            for image in image_files:

                image.seek(0)

                file_bytes = image.read()

                image_hash = HashService.calculate_bytes_sha256(
                    file_bytes
                )

                image.seek(0)

                if image_hash in seen_hashes:
                    continue

                existing = ImageRepository.find_by_hash(image_hash)

                if existing:
                    continue

                seen_hashes.add(image_hash)
                unique_files.append((image, image_hash))

            with transaction.atomic():

                job = JobRepository.create_job(
                    total_images=len(unique_files)
                )

                for image, image_hash in unique_files:

                    uploaded_image = UploadedImage(
                        job=job,
                        image_hash=image_hash,
                    )

                    uploaded_image.image.save(
                        image.name,
                        image,
                        save=False,
                    )

                    uploaded_image.save()

            process_job_task.delay(str(job.id))

            return job

        finally:

            zip_service.cleanup()
