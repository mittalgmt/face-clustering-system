"""
Processing Job Model

Represents a single face clustering request.
"""

from __future__ import annotations

import uuid

from django.db import models
from django.utils import timezone


class JobStatus(models.TextChoices):
    """
    Processing status of a job.
    """

    PENDING = "PENDING", "Pending"

    PROCESSING = "PROCESSING", "Processing"

    COMPLETED = "COMPLETED", "Completed"

    FAILED = "FAILED", "Failed"


class ProcessingJob(models.Model):
    """
    Represents one clustering job.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    status = models.CharField(
        max_length=20,
        choices=JobStatus.choices,
        default=JobStatus.PENDING,
        db_index=True,
    )

    progress = models.PositiveSmallIntegerField(
        default=0,
        help_text="0 - 100"
    )

    total_images = models.PositiveIntegerField(
        default=0
    )

    total_clusters = models.PositiveIntegerField(
        default=0
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "processing_jobs"

        ordering = ["-created_at"]

        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["created_at"]),
        ]

    def mark_processing(self) -> None:
        """
        Mark job as started.
        """
        self.status = JobStatus.PROCESSING
        self.save(update_fields=["status"])

    def update_progress(self, progress: int) -> None:
        """
        Update progress percentage.
        """
        self.progress = max(0, min(100, progress))
        self.save(update_fields=["progress"])

    def mark_completed(self, total_clusters: int) -> None:
        """
        Mark job completed.
        """
        self.status = JobStatus.COMPLETED
        self.progress = 100
        self.total_clusters = total_clusters
        self.completed_at = timezone.now()

        self.save(
            update_fields=[
                "status",
                "progress",
                "total_clusters",
                "completed_at",
            ]
        )

    def mark_failed(self) -> None:
        """
        Mark job failed.
        """
        self.status = JobStatus.FAILED
        self.completed_at = timezone.now()

        self.save(
            update_fields=[
                "status",
                "completed_at",
            ]
        )

    @property
    def is_completed(self) -> bool:
        return self.status == JobStatus.COMPLETED

    @property
    def is_processing(self) -> bool:
        return self.status == JobStatus.PROCESSING

    def __str__(self) -> str:
        return f"{self.id} ({self.status})"