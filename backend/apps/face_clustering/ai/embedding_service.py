"""
Embedding Service.
"""

from __future__ import annotations

import numpy as np

from numpy.linalg import norm


class EmbeddingService:
    """
    ArcFace embedding utilities.
    """

    @staticmethod
    def normalize(
        embedding: np.ndarray,
    ) -> np.ndarray:
        """
        L2 normalize embedding.
        """

        return embedding / norm(embedding)

    def get_embedding(
        self,
        detected_face,
    ) -> np.ndarray:
        """
        Return normalized embedding.
        """

        embedding = detected_face.embedding.astype(
            np.float32
        )

        return self.normalize(embedding)