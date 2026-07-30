from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.face_clustering.api.serializers.job_serializer import JobSerializer
from apps.face_clustering.models.processing_job import ProcessingJob


class JobListView(APIView):
    """
    List all processing jobs.
    """

    def get(self, request):
        jobs = ProcessingJob.objects.all().order_by("-created_at")
        serializer = JobSerializer(jobs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
