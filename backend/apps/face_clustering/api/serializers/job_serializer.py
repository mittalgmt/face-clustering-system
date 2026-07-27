from rest_framework import serializers

from apps.face_clustering.models.processing_job import ProcessingJob


class JobSerializer(serializers.ModelSerializer):
    """
    Serializer for ProcessingJob responses.
    """

    progress = serializers.SerializerMethodField()

    class Meta:
        model = ProcessingJob
        fields = (
            "id",
            "status",
            "total_images",
            "processed_images",
            "progress",
            "created_at",
            "updated_at",
        )

    def get_progress(self, obj):
        """
        Calculate processing progress percentage.
        """
        if obj.total_images == 0:
            return 0

        return round(
            (obj.processed_images / obj.total_images) * 100,
            2,
        )