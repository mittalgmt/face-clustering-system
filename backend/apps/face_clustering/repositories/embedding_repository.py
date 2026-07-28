from __future__ import annotations

import numpy as np
from django.db import transaction

from apps.face_clustering.models.uploaded_image import UploadedImage


class EmbeddingRepository:
    """Repository for embedding persistence."""

    @staticmethod
    def save_embedding(
        image: UploadedImage,
        embedding,
    ) -> UploadedImage:
        """
        Save embedding for a single image.
        """
        image.embedding = embedding.tolist()
        image.save(update_fields=["embedding"])
        return image

    @staticmethod
    def get_embedding(
        image: UploadedImage,
    ) -> np.ndarray | None:
        """
        Return an image embedding as a NumPy array.
        """
        if image.embedding is None:
            return None
        return np.asarray(image.embedding, dtype=np.float32)

    @staticmethod
    def bulk_update_embeddings(
        images: list[UploadedImage],
    ) -> None:
        """
        Bulk update embeddings.
        """
        with transaction.atomic():
            UploadedImage.objects.bulk_update(
                images,
                ["embedding"],
            )
