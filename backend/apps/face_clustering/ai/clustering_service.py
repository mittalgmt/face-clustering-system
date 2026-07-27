"""
Clustering Service

Runs DBSCAN clustering on face embeddings.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from sklearn.cluster import DBSCAN


@dataclass(slots=True)
class ClusteringResult:
    """
    Result returned by clustering.
    """

    labels: np.ndarray
    total_clusters: int
    noise_points: int


class ClusteringService:
    """
    Performs unsupervised clustering using DBSCAN.
    """

    def __init__(
        self,
        eps: float = 0.35,
        min_samples: int = 2,
    ) -> None:

        self.eps = eps
        self.min_samples = min_samples

    def cluster(
        self,
        embeddings: np.ndarray,
    ) -> ClusteringResult:
        """
        Cluster normalized embeddings.

        Returns
        -------
        labels:
            Cluster labels

        total_clusters:
            Number of clusters

        noise_points:
            Number of outliers (-1)
        """

        if len(embeddings) == 0:
            return ClusteringResult(
                labels=np.array([]),
                total_clusters=0,
                noise_points=0,
            )

        dbscan = DBSCAN(
            eps=self.eps,
            min_samples=self.min_samples,
            metric="cosine",
        )

        labels = dbscan.fit_predict(embeddings)

        unique = set(labels)

        total_clusters = len(unique - {-1})

        noise = np.sum(labels == -1)

        return ClusteringResult(
            labels=labels,
            total_clusters=total_clusters,
            noise_points=int(noise),
        )