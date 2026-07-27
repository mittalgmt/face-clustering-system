from __future__ import annotations

from django.db import transaction

from apps.face_clustering.models.cluster import Cluster
from apps.face_clustering.models.cluster_image import ClusterImage
from apps.face_clustering.models.processing_job import ProcessingJob


class ClusterRepository:
    """Repository for cluster database operations."""

    @staticmethod
    def create_cluster(
        *,
        job: ProcessingJob,
        label: int,
        confidence: float,
    ) -> Cluster:
        return Cluster.objects.create(
            job=job,
            label=label,
            confidence=confidence,
        )

    @staticmethod
    def bulk_create_cluster_images(
        cluster_images: list[ClusterImage],
    ) -> None:
        with transaction.atomic():
            ClusterImage.objects.bulk_create(cluster_images)

    @staticmethod
    def get_clusters_by_job(
        job: ProcessingJob,
    ):
        return (
            Cluster.objects
            .filter(job=job)
            .prefetch_related("cluster_images")
            .order_by("label")
        )