from uuid import UUID

from django.db import transaction
from django.utils import timezone

from apps.face_clustering.models.processing_job import (
    ProcessingJob,
    JobStatus,
)


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
        job.save(update_fields=["status"])
        return job

    @staticmethod
    def update_progress(
        job: ProcessingJob,
        *,
        progress: int,
    ) -> ProcessingJob:
        """
        Update processing progress.
        """
        job.progress = progress
        job.save(update_fields=["progress"])
        return job

    @staticmethod
    def mark_processing(job: ProcessingJob) -> ProcessingJob:
        """
        Mark job as processing.
        """
        job.status = JobStatus.PROCESSING
        job.save(update_fields=["status"])
        return job

    @staticmethod
    def mark_completed(
        job: ProcessingJob,
        *,
        clusters: int | None = None,
    ) -> ProcessingJob:
        """
        Mark job as completed.
        """
        job.status = JobStatus.COMPLETED

        update_fields = ["status"]

        if clusters is not None:
            job.total_clusters = clusters
            update_fields.append("total_clusters")

        job.progress = 100
        job.completed_at = timezone.now()
        update_fields.extend(["progress", "completed_at"])

        job.save(update_fields=update_fields)
        return job

    @staticmethod
    def mark_failed(job: ProcessingJob) -> ProcessingJob:
        """
        Mark job as failed.
        """
        job.status = JobStatus.FAILED
        job.completed_at = timezone.now()
        job.save(update_fields=["status", "completed_at"])
        return job
