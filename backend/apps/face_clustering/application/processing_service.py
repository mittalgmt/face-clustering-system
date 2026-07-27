"""
Processing Service

Application service that orchestrates the complete
face clustering workflow.

Responsibilities
----------------
- Update job status
- Execute pipelines
- Update progress
- Handle failures
- Mark job completed

Contains NO AI logic.
"""

from __future__ import annotations

import logging

from django.db import transaction

from apps.face_clustering.models.processing_job import ProcessingJob
from apps.face_clustering.repositories.job_repository import JobRepository
from apps.face_clustering.services.image_processing_pipeline import (
    ImageProcessingPipeline,
)
from apps.face_clustering.services.cluster_pipeline import (
    ClusterPipeline,
)
from apps.face_clustering.services.result_pipeline import (
    ResultPipeline,
)

logger = logging.getLogger(__name__)


class ProcessingService:
    """
    Application service responsible for coordinating
    the complete processing workflow.
    """

    def __init__(
        self,
        job_repository: JobRepository,
        image_pipeline: ImageProcessingPipeline,
        cluster_pipeline: ClusterPipeline,
        result_pipeline: ResultPipeline,
    ) -> None:

        self.job_repository = job_repository
        self.image_pipeline = image_pipeline
        self.cluster_pipeline = cluster_pipeline
        self.result_pipeline = result_pipeline

    @transaction.atomic
    def process(
        self,
        job: ProcessingJob,
    ) -> None:
        """
        Execute the complete workflow.
        """

        logger.info(
            "Starting processing job %s",
            job.id,
        )

        try:

            self.job_repository.mark_processing(job)

            # -----------------------------
            # Image Processing
            # -----------------------------

            image_result = (
                self.image_pipeline.process_job(job)
            )

            self.job_repository.update_progress(
                job,
                50,
            )

            # -----------------------------
            # Clustering
            # -----------------------------

            clustering_result = (
                self.cluster_pipeline.cluster(
                    image_result.processed_images
                )
            )

            self.job_repository.update_progress(
                job,
                80,
            )

            # -----------------------------
            # Persist Results
            # -----------------------------

            self.result_pipeline.persist(
                job=job,
                result=clustering_result,
            )

            self.job_repository.update_progress(
                job,
                100,
            )

            logger.info(
                "Job %s completed successfully.",
                job.id,
            )

        except Exception:

            logger.exception(
                "Job %s failed.",
                job.id,
            )

            self.job_repository.mark_failed(job)

            raise