"""
DRF Serializers

Defines request/response schemas for the Face Clustering API.
"""

from __future__ import annotations

from rest_framework import serializers

from apps.face_clustering.models.processing_job import ProcessingJob
from apps.face_clustering.models.uploaded_image import UploadedImage
from apps.face_clustering.models.cluster import Cluster
from apps.face_clustering.models.cluster_image import ClusterImage


class ImageUploadSerializer(serializers.Serializer):
    """
    Request serializer for uploading images.
    """

    images = serializers.ListField(
        child=serializers.ImageField(),
        allow_empty=False,
        max_length=1000,
    )

    def validate_images(self, images):
        """
        Validate uploaded images.
        """

        if not images:
            raise serializers.ValidationError(
                "At least one image is required."
            )

        return images


class JobCreateResponseSerializer(serializers.Serializer):
    """
    Response after creating a job.
    """

    job_id = serializers.UUIDField()

    status = serializers.CharField()

    total_images = serializers.IntegerField()


class JobStatusSerializer(serializers.ModelSerializer):
    """
    Job status serializer.
    """

    class Meta:

        model = ProcessingJob

        fields = (
            "id",
            "status",
            "progress",
            "total_images",
            "total_clusters",
            "created_at",
            "completed_at",
        )


class ClusterImageSerializer(serializers.ModelSerializer):
    """
    Images inside one cluster.
    """

    image_url = serializers.SerializerMethodField()

    class Meta:

        model = ClusterImage

        fields = (
            "id",
            "confidence",
            "distance_to_centroid",
            "image_url",
        )

    def get_image_url(self, obj):

        request = self.context.get("request")

        if request:

            return request.build_absolute_uri(
                obj.image.image.url
            )

        return obj.image.image.url


class ClusterSerializer(serializers.ModelSerializer):
    """
    Cluster response.
    """

    images = ClusterImageSerializer(
        many=True,
        source="clusterimage_set",
        read_only=True,
    )

    class Meta:

        model = Cluster

        fields = (
            "id",
            "cluster_number",
            "image_count",
            "created_at",
            "images",
        )


class JobResultSerializer(serializers.Serializer):
    """
    Complete response returned to frontend.
    """

    job = JobStatusSerializer()

    clusters = ClusterSerializer(
        many=True,
    )