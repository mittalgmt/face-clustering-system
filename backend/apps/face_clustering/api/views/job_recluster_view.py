from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.face_clustering.models.processing_job import ProcessingJob, JobStatus
from apps.face_clustering.models.uploaded_image import UploadedImage, ImageProcessingStatus
from apps.face_clustering.repositories.job_repository import JobRepository
from apps.face_clustering.tasks.processing_tasks import process_job_task


class JobReclusterView(APIView):
    """
    Reset and trigger re-clustering for an existing job.
    """

    def post(self, request, job_id):
        job = JobRepository.get_by_id(job_id)

        if job is None:
            return Response(
                {"detail": "Job not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        with transaction.atomic():
            # Reset job fields
            job.status = JobStatus.PENDING
            job.progress = 0
            job.total_clusters = 0
            job.completed_at = None
            job.save()

            # Reset image fields
            job.images.all().update(
                processing_status=ImageProcessingStatus.PENDING,
                error_message="",
                face_detected=False,
                duplicate=False
            )

            # Delete old clusters (cascade deletes cluster_images)
            job.clusters.all().delete()

        # Enqueue Celery task for reprocessing
        process_job_task.delay(str(job.id))

        return Response(
            {
                "job_id": str(job.id),
                "status": job.status,
                "message": "Re-clustering job scheduled successfully.",
            },
            status=status.HTTP_200_OK,
        )
