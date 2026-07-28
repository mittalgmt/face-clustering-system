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
        cluster_number: int,
        centroid,
    ) -> Cluster:
        """
        Create a cluster.
        """
        return Cluster.objects.create(
            job=job,
            cluster_number=cluster_number,
            centroid=centroid.tolist()
            if hasattr(centroid, "tolist")
            else centroid,
        )

    @staticmethod
    def bulk_create_cluster_images(
        cluster_images: list[ClusterImage],
    ) -> None:
        with transaction.atomic():
            ClusterImage.objects.bulk_create(cluster_images)

    @staticmethod
    def delete_job_clusters(
        job: ProcessingJob,
    ) -> None:
        """
        Delete all clusters for a job.
        """
        Cluster.objects.filter(job=job).delete()

    @staticmethod
    def add_image(
        *,
        cluster: Cluster,
        image,
        confidence: float,
        distance: float,
    ) -> ClusterImage:
        """
        Add an image to a cluster.
        """
        return ClusterImage.objects.create(
            cluster=cluster,
            image=image,
            confidence=confidence,
            distance_to_centroid=distance,
        )

    @staticmethod
    def get_clusters_by_job(
        job: ProcessingJob,
    ):
        return (
            Cluster.objects
            .filter(job=job)
            .prefetch_related("images")
            .order_by("cluster_number")
        )
