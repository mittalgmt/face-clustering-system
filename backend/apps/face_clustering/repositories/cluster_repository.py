"""
Repository for Cluster.
"""

from __future__ import annotations

from django.db import transaction

from apps.face_clustering.models.cluster import (
    Cluster,
)

from apps.face_clustering.models.cluster_image import (
    ClusterImage,
)

from apps.face_clustering.models.processing_job import (
    ProcessingJob,
)

from apps.face_clustering.models.uploaded_image import (
    UploadedImage,
)


class ClusterRepository:

    @staticmethod
    @transaction.atomic
    def create_cluster(
        *,
        job: ProcessingJob,
        cluster_number: int,
        centroid,
    ) -> Cluster:

        return Cluster.objects.create(
            job=job,
            cluster_number=cluster_number,
            centroid=centroid.tolist(),
        )

    @staticmethod
    @transaction.atomic
    def add_image(
        *,
        cluster: Cluster,
        image: UploadedImage,
        confidence: float,
        distance: float,
    ) -> ClusterImage:

        return ClusterImage.objects.create(
            cluster=cluster,
            image=image,
            confidence=confidence,
            distance_to_centroid=distance,
        )

    @staticmethod
    def get_clusters(
        job: ProcessingJob,
    ):

        return (
            Cluster.objects
            .filter(job=job)
            .prefetch_related("images")
            .order_by("cluster_number")
        )

    @staticmethod
    def delete_job_clusters(
        job: ProcessingJob,
    ) -> None:

        Cluster.objects.filter(
            job=job
        ).delete()