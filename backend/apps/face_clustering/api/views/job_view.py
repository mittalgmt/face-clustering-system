from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.face_clustering.api.serializers.job_serializer import JobSerializer
from apps.face_clustering.repositories.job_repository import JobRepository


class JobView(APIView):
    """
    Retrieve processing job status.
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