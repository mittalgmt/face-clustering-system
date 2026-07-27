"""
Embedding Repository.
"""

from __future__ import annotations

import numpy as np

from apps.face_clustering.models.uploaded_image import (
    UploadedImage,
)


class EmbeddingRepository:

    @staticmethod
    def save_embedding(
        image: UploadedImage,
        embedding: np.ndarray,
    ) -> None:

        image.embedding = embedding.tolist()

        image.save(
            update_fields=[
                "embedding",
            ]
        )

    @staticmethod
    def get_embedding(
        image: UploadedImage,
    ) -> np.ndarray | None:

        if image.embedding is None:
            return None

        return np.asarray(
            image.embedding,
            dtype=np.float32,
        )

    @staticmethod
    def has_embedding(
        image: UploadedImage,
    ) -> bool:

        return image.embedding is not None