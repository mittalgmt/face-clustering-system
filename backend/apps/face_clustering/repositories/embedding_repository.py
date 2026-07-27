from __future__ import annotations

from django.db import transaction

from apps.face_clustering.models.uploaded_image import UploadedImage


class EmbeddingRepository:
    """Repository for embedding persistence."""

    @staticmethod
    def update_embedding(
        image: UploadedImage,
        *,
        embedding,
    ) -> UploadedImage:
        """
        Save embedding for a single image.
        """
        image.embedding = embedding
        image.save(update_fields=["embedding", "updated_at"])
        return image

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
                ["embedding", "updated_at"],
            )