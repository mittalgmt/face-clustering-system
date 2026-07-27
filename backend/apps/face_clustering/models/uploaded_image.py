"""
Uploaded Image Model

Stores uploaded images and their associated metadata,
including image hash, face embedding, duplicate detection,
and processing status.
"""

from __future__ import annotations

import uuid

from django.db import models
from django.contrib.postgres.fields import ArrayField

from .processing_job import ProcessingJob


class ImageProcessingStatus(models.TextChoices):
    """
    Individual image processing status.
    """

    PENDING = "PENDING", "Pending"

    PROCESSING = "PROCESSING", "Processing"

    COMPLETED = "COMPLETED", "Completed"

    FAILED = "FAILED", "Failed"

    NO_FACE = "NO_FACE", "No Face Detected"


class UploadedImage(models.Model):
    """
    Represents one uploaded image.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    job = models.ForeignKey(
        ProcessingJob,
        on_delete=models.CASCADE,
        related_name="images",
        db_index=True,
    )

    image = models.ImageField(
        upload_to="uploads/%Y/%m/%d/",
    )

    image_hash = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        help_text="SHA256 hash of image",
    )

    embedding = ArrayField(
        base_field=models.FloatField(),
        size=512,
        null=True,
        blank=True,
        help_text="Normalized ArcFace embedding",
    )

    face_detected = models.BooleanField(
        default=False,
    )

    duplicate = models.BooleanField(
        default=False,
    )

    processing_status = models.CharField(
        max_length=20,
        choices=ImageProcessingStatus.choices,
        default=ImageProcessingStatus.PENDING,
        db_index=True,
    )

    error_message = models.TextField(
        blank=True,
        default="",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        db_table = "uploaded_images"

        ordering = ["created_at"]

        indexes = [
            models.Index(fields=["image_hash"]),
            models.Index(fields=["job"]),
            models.Index(fields=["processing_status"]),
            models.Index(fields=["created_at"]),
        ]

    # ------------------------------------------------------------------
    # Helper Methods
    # ------------------------------------------------------------------

    def mark_processing(self) -> None:
        """
        Mark image as currently processing.
        """
        self.processing_status = ImageProcessingStatus.PROCESSING

        self.save(update_fields=["processing_status"])

    def mark_completed(self) -> None:
        """
        Mark image processing as completed.
        """
        self.processing_status = ImageProcessingStatus.COMPLETED

        self.save(update_fields=["processing_status"])

    def mark_duplicate(self) -> None:
        """
        Mark image as duplicate.
        """
        self.duplicate = True

        self.save(update_fields=["duplicate"])

    def mark_face_detected(self) -> None:
        """
        Mark successful face detection.
        """
        self.face_detected = True

        self.save(update_fields=["face_detected"])

    def mark_no_face(self) -> None:
        """
        No face detected.
        """
        self.processing_status = ImageProcessingStatus.NO_FACE

        self.save(update_fields=["processing_status"])

    def mark_failed(self, message: str) -> None:
        """
        Store processing error.
        """
        self.processing_status = ImageProcessingStatus.FAILED

        self.error_message = message

        self.save(
            update_fields=[
                "processing_status",
                "error_message",
            ]
        )

    @property
    def has_embedding(self) -> bool:
        """
        Returns True if embedding exists.
        """
        return self.embedding is not None

    def __str__(self) -> str:
        return f"{self.id} - {self.processing_status}"