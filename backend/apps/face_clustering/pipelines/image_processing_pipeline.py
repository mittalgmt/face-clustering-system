"""
Image Processing Pipeline

Responsible for processing individual uploaded images.

Pipeline:

Validate
    ↓
SHA256 Hash
    ↓
Duplicate Detection
    ↓
Face Detection
    ↓
Embedding Extraction
    ↓
Return ProcessedImage DTO
"""

from __future__ import annotations

import logging
from typing import Iterable

from django.db import transaction

from apps.face_clustering.models.processing_job import ProcessingJob
from apps.face_clustering.models.uploaded_image import UploadedImage
from apps.face_clustering.repositories.image_repository import ImageRepository
from apps.face_clustering.repositories.embedding_repository import EmbeddingRepository
from apps.face_clustering.common.dto import (
    ProcessedImage,
    PipelineResult,
)
from apps.face_clustering.common.hash_service import HashService
from apps.face_clustering.common.duplicate_service import DuplicateService
from apps.face_clustering.ai.face_detection_service import (
    FaceDetectionService,
)
from apps.face_clustering.ai.embedding_service import (
    EmbeddingService,
)
from apps.face_clustering.utils.exceptions import (
    NoFaceDetectedException,
)

logger = logging.getLogger(__name__)


class ImageProcessingPipeline:
    """
    Handles image preprocessing.

    Responsibilities
    ----------------
    - Generate SHA256 hash
    - Detect duplicates
    - Detect face
    - Generate embedding
    """

    def __init__(
        self,
        image_repository: ImageRepository,
        embedding_repository: EmbeddingRepository,
        hash_service: HashService,
        duplicate_service: DuplicateService,
        detector: FaceDetectionService,
        embedding_service: EmbeddingService,
    ) -> None:

        self.image_repository = image_repository
        self.embedding_repository = embedding_repository
        self.hash_service = hash_service
        self.duplicate_service = duplicate_service
        self.detector = detector
        self.embedding_service = embedding_service

    @transaction.atomic
    def process_job(
        self,
        job: ProcessingJob,
    ) -> PipelineResult:
        """
        Process every uploaded image belonging to a job.
        """

        processed_images: list[ProcessedImage] = []
        failed_images: list[UploadedImage] = []
        skipped_images: list[UploadedImage] = []

        images = self.image_repository.get_by_job(job)

        for image in images:

            try:

                processed = self.process_image(image)

                if processed is None:
                    skipped_images.append(image)
                    continue

                processed_images.append(processed)

            except Exception:

                logger.exception(
                    "Failed processing image %s",
                    image.id,
                )

                image.mark_failed()

                failed_images.append(image)

        return PipelineResult(
            processed_images=processed_images,
            failed_images=failed_images,
            skipped_images=skipped_images,
        )

    def process_image(
        self,
        image: UploadedImage,
    ) -> ProcessedImage | None:
        """
        Process one uploaded image.
        """

        image.mark_processing()

        image_hash = self.hash_service.calculate_sha256(
            image.image.path
        )

        image.image_hash = image_hash

        self.image_repository.save(image)

        duplicate = self.duplicate_service.check_duplicate(
            image_hash
        )

        if (
            duplicate.is_duplicate
            and duplicate.existing_image.id != image.id
        ):

            self.duplicate_service.reuse_embedding(
                source=duplicate.existing_image,
                target=image,
            )

            image.mark_completed()

            return ProcessedImage(
                image=image,
                embedding=self.embedding_repository.get_embedding(
                    image
                ),
                duplicate=True,
            )

        try:

            face = self.detector.detect(
                image.image.path
            )

        except NoFaceDetectedException:

            image.mark_no_face()

            return None

        embedding = self.embedding_service.get_embedding(
            face
        )

        self.embedding_repository.save_embedding(
            image,
            embedding,
        )

        image.mark_face_detected()

        image.mark_completed()

        return ProcessedImage(
            image=image,
            embedding=embedding,
            duplicate=False,
        )

    def process_images(
        self,
        images: Iterable[UploadedImage],
    ) -> list[ProcessedImage]:
        """
        Optional helper for batch processing.
        """

        results: list[ProcessedImage] = []

        for image in images:

            processed = self.process_image(image)

            if processed is not None:
                results.append(processed)

        return results