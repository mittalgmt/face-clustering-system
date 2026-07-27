"""
Confidence Service.
"""

from __future__ import annotations

import numpy as np


class ConfidenceService:
    """
    Calculates confidence scores for clustered faces.
    """

    @staticmethod
    def normalize(
        vector: np.ndarray,
    ) -> np.ndarray:

        return vector / np.linalg.norm(vector)

    def centroid(
        self,
        embeddings: np.ndarray,
    ) -> np.ndarray:
        """
        Calculate normalized centroid.
        """

        center = np.mean(
            embeddings,
            axis=0,
        )

        return self.normalize(center)

    @staticmethod
    def cosine_similarity(
        a: np.ndarray,
        b: np.ndarray,
    ) -> float:

        return float(np.dot(a, b))

    def confidence(
        self,
        embedding: np.ndarray,
        centroid: np.ndarray,
    ) -> float:
        """
        Returns confidence percentage.
        """

        similarity = self.cosine_similarity(
            embedding,
            centroid,
        )

        confidence = similarity * 100

        return max(
            0.0,
            min(100.0, confidence),
        )

    @staticmethod
    def distance(
        embedding: np.ndarray,
        centroid: np.ndarray,
    ) -> float:
        """
        Cosine distance.
        """

        similarity = float(
            np.dot(
                embedding,
                centroid,
            )
        )

        return 1 - similarity