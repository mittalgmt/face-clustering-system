"""
Repository for ProcessingJob model.
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from django.db import transaction

from apps.face_clustering.models.processing_job import (
    ProcessingJob,
    JobStatus,
)


class JobRepository:
    """
    Repository for ProcessingJob operations.
    """

    @staticmethod
    @transaction.atomic
    def create(total_images: int) -> ProcessingJob:
        """
        Create a new processing job.
        """
        return ProcessingJob.objects.create(
            total_images=total_images,
            status=JobStatus.PENDING,
            progress=0,
        )

    @staticmethod
    def get(job_id: UUID) -> Optional[ProcessingJob]:
        """
        Get job by UUID.
        """
        return (
            ProcessingJob.objects
            .filter(id=job_id)
            .first()
        )

    @staticmethod
    def list():
        """
        Return all jobs.
        """
        return (
            ProcessingJob.objects
            .all()
            .order_by("-created_at")
        )

    @staticmethod
    def save(job: ProcessingJob) -> None:
        """
        Save job.
        """
        job.save()

    @staticmethod
    def delete(job: ProcessingJob) -> None:
        """
        Delete job.
        """
        job.delete()

    @staticmethod
    def update_progress(
        job: ProcessingJob,
        progress: int,
    ) -> None:
        """
        Update job progress.
        """
        job.progress = progress
        job.save(update_fields=["progress"])

    @staticmethod
    def mark_processing(
        job: ProcessingJob,
    ) -> None:
        """
        Mark job as processing.
        """
        job.status = JobStatus.PROCESSING
        job.save(update_fields=["status"])

    @staticmethod
    def mark_completed(
        job: ProcessingJob,
        clusters: int,
    ) -> None:
        """
        Mark job completed.
        """
        job.mark_completed(clusters)

    @staticmethod
    def mark_failed(
        job: ProcessingJob,
    ) -> None:
        """
        Mark job failed.
        """
        job.mark_failed()