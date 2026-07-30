"""
Cluster Pipeline

Groups processed face embeddings into clusters.

Pipeline

Processed Images
        │
        ▼
Extract Embeddings
        │
        ▼
DBSCAN
        │
        ▼
Compute Centroids
        │
        ▼
Calculate Confidence
        │
        ▼
Return ClusterDTO objects
"""

from __future__ import annotations

from collections import defaultdict
import logging

import numpy as np

from apps.face_clustering.common.dto import (
    ClusterDTO,
    ClusterItem,
    ClusteringPipelineResult,
    ProcessedImage,
)
from apps.face_clustering.ai.clustering_service import (
    ClusteringService,
)
from apps.face_clustering.ai.confidence_service import (
    ConfidenceService,
)

logger = logging.getLogger(__name__)


class ClusterPipeline:
    """
    Creates face clusters from processed images.
    """

    def __init__(
        self,
        clustering_service: ClusteringService,
        confidence_service: ConfidenceService,
    ) -> None:

        self.clustering_service = clustering_service
        self.confidence_service = confidence_service

    def cluster(
        self,
        processed_images: list[ProcessedImage],
    ) -> ClusteringPipelineResult:
        """
        Cluster processed images.
        """

        if not processed_images:

            return ClusteringPipelineResult(
                clusters=[],
                noise_images=[],
                total_clusters=0,
            )

        embeddings = np.asarray(
            [
                item.embedding
                for item in processed_images
            ],
            dtype=np.float32,
        )
        clustering = self.clustering_service.cluster(
            embeddings
        )
        logger.debug("=" * 60)
        logger.debug(
            "DBSCAN LABELS: %s",
            clustering.labels.tolist(),
        )
        logger.debug("=" * 60)
        logger.debug(
            "Total clusters: %s | Noise points: %s",
            clustering.total_clusters,
            clustering.noise_points,
        )

        grouped: dict[int, list[ProcessedImage]] = defaultdict(list)

        noise_images: list[ProcessedImage] = []

        for label, image in zip(
            clustering.labels,
            processed_images,
        ):
            logger.debug(
                "%s --> Label: %s",
                image.image.image.name,
                label,
            )

            if label == -1:

                noise_images.append(image)

                continue

            grouped[int(label)].append(image)

        clusters: list[ClusterDTO] = []

        for cluster_number, images in grouped.items():

            cluster_embeddings = np.asarray(
                [
                    item.embedding
                    for item in images
                ],
                dtype=np.float32,
            )

            centroid = self.confidence_service.centroid(
                cluster_embeddings
            )

            cluster_items: list[ClusterItem] = []

            for item in images:

                confidence = (
                    self.confidence_service.confidence(
                        item.embedding,
                        centroid,
                    )
                )

                distance = (
                    self.confidence_service.distance(
                        item.embedding,
                        centroid,
                    )
                )

                cluster_items.append(
                    ClusterItem(
                        image=item.image,
                        embedding=item.embedding,
                        confidence=confidence,
                        distance=distance,
                    )
                )

            clusters.append(
                ClusterDTO(
                    cluster_number=cluster_number,
                    centroid=centroid,
                    items=cluster_items,
                )
            )

        clusters.sort(
            key=lambda cluster: cluster.cluster_number
        )

        return ClusteringPipelineResult(
            clusters=clusters,
            noise_images=noise_images,
            total_clusters=len(clusters),
        )
