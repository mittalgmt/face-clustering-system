from rest_framework import serializers

from apps.face_clustering.models.processing_job import ProcessingJob


class JobSerializer(serializers.ModelSerializer):
    """
    Serializer for ProcessingJob responses.
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
