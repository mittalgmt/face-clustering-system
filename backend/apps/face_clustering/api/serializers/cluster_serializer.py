from rest_framework import serializers

from apps.face_clustering.models.cluster import Cluster
from apps.face_clustering.models.cluster_image import ClusterImage


class ClusterImageSerializer(serializers.ModelSerializer):
    """
    Serializer for images inside a cluster.
    """

    class Meta:
        model = ClusterImage
        fields = (
            "id",
            "uploaded_image",
            "confidence",
        )


class ClusterSerializer(serializers.ModelSerializer):
    """
    Serializer for cluster results.
    """

    images = ClusterImageSerializer(
        source="cluster_images",
        many=True,
        read_only=True,
    )

    image_count = serializers.SerializerMethodField()

    class Meta:
        model = Cluster
        fields = (
            "id",
            "label",
            "confidence",
            "image_count",
            "images",
        )

    def get_image_count(self, obj):
        return obj.cluster_images.count()