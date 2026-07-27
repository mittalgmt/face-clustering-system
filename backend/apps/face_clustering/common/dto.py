"""
Data Transfer Objects (DTOs)

Shared objects passed between services and pipelines.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional

import numpy as np

from apps.face_clustering.models.uploaded_image import UploadedImage


@dataclass(slots=True)
class ProcessedImage:
    """
    Represents an image after preprocessing.
    """

    image: UploadedImage

    embedding: np.ndarray

    duplicate: bool

    face_detected: bool = True


@dataclass(slots=True)
class ClusterItem:
    """
    One image belonging to a cluster.
    """

    image: UploadedImage

    embedding: np.ndarray

    confidence: float = 0.0

    distance: float = 0.0


@dataclass(slots=True)
class ClusterDTO:
    """
    Represents one cluster before persistence.
    """

    cluster_number: int

    centroid: np.ndarray

    items: List[ClusterItem] = field(default_factory=list)


@dataclass(slots=True)
class PipelineResult:
    """
    Result returned from ImageProcessingPipeline.
    """

    processed_images: List[ProcessedImage]

    failed_images: List[UploadedImage]

    skipped_images: List[UploadedImage]


@dataclass(slots=True)
class ClusteringPipelineResult:
    """
    Result returned from ClusterPipeline.
    """

    clusters: List[ClusterDTO]

    noise_images: List[ProcessedImage]

    total_clusters: int