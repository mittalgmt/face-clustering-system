from rest_framework import serializers

from apps.face_clustering.models.cluster import Cluster
from apps.face_clustering.models.cluster_image import ClusterImage


class ClusterImageSerializer(serializers.ModelSerializer):
    """
    Serializer for images inside a cluster.
    """

    filename = serializers.SerializerMethodField()

    class Meta:
        model = ClusterImage
        fields = (
            "filename",
            "confidence",
            "distance_to_centroid",
        )

    def get_filename(self, obj):
        return obj.image.image.name.rsplit("/", 1)[-1]


class ClusterSerializer(serializers.ModelSerializer):
    """
    Serializer for cluster results.
    """

    images = ClusterImageSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Cluster
        fields = (
            "id",
            "cluster_number",
            "image_count",
            "images",
        )
