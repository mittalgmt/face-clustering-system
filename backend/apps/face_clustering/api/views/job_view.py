from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.face_clustering.api.serializers.job_serializer import JobSerializer
from apps.face_clustering.repositories.job_repository import JobRepository


class JobView(APIView):
    """
    Retrieve processing job status or delete job.
    """

    def get(self, request, job_id):
        job = JobRepository.get_by_id(job_id)

        if job is None:
            return Response(
                {"detail": "Job not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = JobSerializer(job)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request, job_id):
        job = JobRepository.get_by_id(job_id)

        if job is None:
            return Response(
                {"detail": "Job not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Soft delete: flag job as is_deleted
        job.is_deleted = True
        job.save(update_fields=["is_deleted"])

        # Modify image hashes to avoid unique constraint violations on new uploads
        for img in job.images.all():
            new_hash = f"{img.image_hash}_del_{job.id.hex[:8]}"
            if len(new_hash) > 64:
                new_hash = new_hash[-64:]
            img.image_hash = new_hash
            img.save(update_fields=["image_hash"])

        return Response(
            {"detail": "Job soft-deleted successfully."},
            status=status.HTTP_200_OK,
        )