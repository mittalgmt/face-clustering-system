from uuid import UUID

from django.db import transaction

from apps.face_clustering.models.processing_job import ProcessingJob


class JobRepository:
    """Repository for ProcessingJob database operations."""

    @staticmethod
    def create_job(total_images: int) -> ProcessingJob:
        """
        Create a new processing job.
        """
        with transaction.atomic():
            return ProcessingJob.objects.create(
                total_images=total_images,
            )

    @staticmethod
    def get_by_id(job_id: UUID) -> ProcessingJob | None:
        """
        Get a job by its ID.
        """
        try:
            return ProcessingJob.objects.get(id=job_id)
        except ProcessingJob.DoesNotExist:
            return None

    @staticmethod
    def update_status(
        job: ProcessingJob,
        *,
        status: str,
    ) -> ProcessingJob:
        """
        Update job status.
        """
        job.status = status
        job.save(update_fields=["status", "updated_at"])
        return job

    @staticmethod
    def update_progress(
        job: ProcessingJob,
        *,
        processed_images: int,
    ) -> ProcessingJob:
        """
        Update processing progress.
        """
        job.processed_images = processed_images
        job.save(update_fields=["processed_images", "updated_at"])
        return job

    @staticmethod
    def mark_completed(job: ProcessingJob) -> ProcessingJob:
        """
        Mark job as completed.
        """
        job.status = ProcessingJob.Status.COMPLETED
        job.save(update_fields=["status", "updated_at"])
        return job

    @staticmethod
    def mark_failed(job: ProcessingJob) -> ProcessingJob:
        """
        Mark job as failed.
        """
        job.status = ProcessingJob.Status.FAILED
        job.save(update_fields=["status", "updated_at"])
        return job