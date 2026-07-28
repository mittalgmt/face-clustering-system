"""
Result Pipeline

Persists clustering results into the database.

Responsibilities
----------------
- Create Cluster records
- Create ClusterImage records
- Update cluster statistics
- Update job statistics

This pipeline contains NO AI logic.
"""

from __future__ import annotations

from django.db import transaction

from apps.face_clustering.models.processing_job import ProcessingJob
from apps.face_clustering.repositories.cluster_repository import (
    ClusterRepository,
)
from apps.face_clustering.repositories.job_repository import (
    JobRepository,
)
from apps.face_clustering.common.dto import (
    ClusterDTO,
    ClusteringPipelineResult,
)


class ResultPipeline:
    """
    Saves clustering results to the database.
    """

    def __init__(
        self,
        cluster_repository: ClusterRepository,
        job_repository: JobRepository,
    ) -> None:

        self.cluster_repository = cluster_repository
        self.job_repository = job_repository

    @transaction.atomic
    def persist(
        self,
        *,
        job: ProcessingJob,
        result: ClusteringPipelineResult,
    ) -> None:
        """
        Persist all clusters for a processing job.
        """

        # Remove existing results (safe for reprocessing)
        self.cluster_repository.delete_job_clusters(job)

        for cluster in result.clusters:
            self._save_cluster(job, cluster)

        self.job_repository.mark_completed(
            job=job,
            clusters=result.total_clusters,
        )

    def _save_cluster(
        self,
        job: ProcessingJob,
        cluster_dto: ClusterDTO,
    ) -> None:
        """
        Save one cluster and its images.
        """

        cluster = self.cluster_repository.create_cluster(
            job=job,
            cluster_number=cluster_dto.cluster_number,
            centroid=cluster_dto.centroid,
        )

        for item in cluster_dto.items:

            self.cluster_repository.add_image(
                cluster=cluster,
                image=item.image,
                confidence=item.confidence,
                distance=item.distance,
            )

        cluster.update_image_count()