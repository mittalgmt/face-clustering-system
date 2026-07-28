from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.face_clustering.api.serializers.cluster_serializer import (
    ClusterSerializer,
)
from apps.face_clustering.repositories.cluster_repository import (
    ClusterRepository,
)
from apps.face_clustering.repositories.job_repository import JobRepository


class ClusterView(APIView):
    """
    Retrieve clustering results for a processing job.
    """

    def get(self, request, job_id):
        job = JobRepository.get_by_id(job_id)

        if job is None:
            return Response(
                {"detail": "Job not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        clusters = ClusterRepository.get_clusters_by_job(job)

        serializer = ClusterSerializer(
            clusters,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )