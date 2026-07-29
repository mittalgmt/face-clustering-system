"""
Celery Tasks

Background tasks for face clustering.
"""

from __future__ import annotations

import logging

from celery import shared_task
from django.db import transaction

from apps.face_clustering.models.processing_job import ProcessingJob, JobStatus

from apps.face_clustering.repositories.job_repository import JobRepository
from apps.face_clustering.repositories.image_repository import ImageRepository
from apps.face_clustering.repositories.embedding_repository import EmbeddingRepository
from apps.face_clustering.repositories.cluster_repository import ClusterRepository

from apps.face_clustering.common.hash_service import HashService
from apps.face_clustering.common.duplicate_service import DuplicateService
from apps.face_clustering.ai.face_detection_service import FaceDetectionService
from apps.face_clustering.ai.embedding_service import EmbeddingService
from apps.face_clustering.ai.clustering_service import ClusteringService
from apps.face_clustering.ai.confidence_service import ConfidenceService

from apps.face_clustering.pipelines.image_processing_pipeline import (
    ImageProcessingPipeline,
)

from apps.face_clustering.pipelines.cluster_pipeline import (
    ClusterPipeline,
)

from apps.face_clustering.pipelines.result_pipeline import (
    ResultPipeline,
)

from apps.face_clustering.application.processing_service import (
    ProcessingService,
)

logger = logging.getLogger(__name__)


def build_processing_service() -> ProcessingService:
    """
    Factory method.

    Creates the complete dependency graph.
    """

    job_repository = JobRepository()

    image_repository = ImageRepository()

    embedding_repository = EmbeddingRepository()

    cluster_repository = ClusterRepository()

    hash_service = HashService()

    duplicate_service = DuplicateService(
        image_repository,
    )

    detector = FaceDetectionService()

    embedding_service = EmbeddingService()

    clustering_service = ClusteringService()

    confidence_service = ConfidenceService()

    image_pipeline = ImageProcessingPipeline(
        image_repository=image_repository,
        embedding_repository=embedding_repository,
        hash_service=hash_service,
        duplicate_service=duplicate_service,
        detector=detector,
        embedding_service=embedding_service,
    )

    cluster_pipeline = ClusterPipeline(
        clustering_service=clustering_service,
        confidence_service=confidence_service,
    )

    result_pipeline = ResultPipeline(
        cluster_repository=cluster_repository,
        job_repository=job_repository,
    )

    return ProcessingService(
        job_repository=job_repository,
        image_pipeline=image_pipeline,
        cluster_pipeline=cluster_pipeline,
        result_pipeline=result_pipeline,
    )


@shared_task(
    bind=True,
    autoretry_for=(
        ConnectionError,
        TimeoutError,
    ),
    retry_backoff=True,
    retry_jitter=True,
    retry_kwargs={
        "max_retries": 5,
    },
)
def process_job_task(
    self,
    job_id: str,
) -> None:
    """
    Background task.

    Processes one job.
    """

    logger.info(
        "Received processing task %s",
        job_id,
    )

    try:

        with transaction.atomic():
            job = (
                ProcessingJob.objects
                .select_for_update()
                .get(
                    id=job_id,
                )
            )
            if job.status in [JobStatus.PROCESSING, JobStatus.COMPLETED]:
                logger.warning("Job %s is already %s. Skipping.", job_id, job.status)
                return
            job.status = JobStatus.PROCESSING
            job.save(update_fields=["status"])

        service = build_processing_service()
        service.process(job)

    except ProcessingJob.DoesNotExist:

        logger.error(
            "Job %s not found.",
            job_id,
        )

        return

    except Exception:

        logger.exception(
            "Processing failed for job %s",
            job_id,
        )

        raise