"""
Cluster Image Model

Links UploadedImage to Cluster while storing
confidence information.
"""

from __future__ import annotations

import uuid

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from .cluster import Cluster
from .uploaded_image import UploadedImage


class ClusterImage(models.Model):
    """
    Mapping table between Cluster and UploadedImage.
    Stores confidence score for each clustered image.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    cluster = models.ForeignKey(
        Cluster,
        on_delete=models.CASCADE,
        related_name="images",
        db_index=True,
    )

    image = models.OneToOneField(
        UploadedImage,
        on_delete=models.CASCADE,
        related_name="cluster_info",
    )

    confidence = models.FloatField(
        validators=[
            MinValueValidator(0.0),
            MaxValueValidator(100.0),
        ],
        help_text="Confidence percentage (0-100)",
    )

    distance_to_centroid = models.FloatField(
        null=True,
        blank=True,
        help_text="Cosine distance to centroid",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        db_table = "cluster_images"

        ordering = [
            "-confidence",
        ]

        indexes = [
            models.Index(fields=["cluster"]),
            models.Index(fields=["confidence"]),
            models.Index(fields=["created_at"]),
        ]

        constraints = [
            models.UniqueConstraint(
                fields=["cluster", "image"],
                name="unique_image_per_cluster",
            )
        ]

    @property
    def confidence_label(self) -> str:
        """
        Returns confidence formatted as percentage.
        """
        return f"{self.confidence:.2f}%"

    def __str__(self) -> str:
        return (
            f"{self.image.id} -> "
            f"Cluster {self.cluster.cluster_number} "
            f"({self.confidence:.2f}%)"
        )