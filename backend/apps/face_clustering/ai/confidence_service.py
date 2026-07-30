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
        norm = np.linalg.norm(vector)
        if norm == 0:
            return vector
        return vector / norm

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
        norm_emb = self.normalize(embedding)
        norm_centroid = self.normalize(centroid)

        similarity = self.cosine_similarity(
            norm_emb,
            norm_centroid,
        )

        threshold = 0.3
        if similarity <= threshold:
            return 0.0

        confidence = ((similarity - threshold) / (1.0 - threshold)) * 100.0

        return float(min(100.0, confidence))

    @staticmethod
    def distance(
        embedding: np.ndarray,
        centroid: np.ndarray,
    ) -> float:
        """
        Cosine distance.
        """
        norm_a = ConfidenceService.normalize(embedding)
        norm_b = ConfidenceService.normalize(centroid)

        similarity = float(
            np.dot(
                norm_a,
                norm_b,
            )
        )

        return 1.0 - similarity