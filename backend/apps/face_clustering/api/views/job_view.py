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

        # Clean up files on disk
        for img in job.images.all():
            if img.image and img.image.storage.exists(img.image.name):
                img.image.storage.delete(img.image.name)

        job.delete()

        return Response(
            {"detail": "Job and all related data deleted successfully."},
            status=status.HTTP_200_OK,
        )