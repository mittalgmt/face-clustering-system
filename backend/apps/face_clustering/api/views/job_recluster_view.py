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
        parent_job = JobRepository.get_by_id(job_id)

        if parent_job is None:
            return Response(
                {"detail": "Job not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Get custom parameters from request or fall back
        eps = float(request.data.get("eps", parent_job.eps))
        min_samples = int(request.data.get("min_samples", parent_job.min_samples))

        with transaction.atomic():
            # Create a new version of the job
            new_job = ProcessingJob.objects.create(
                status=JobStatus.PENDING,
                progress=0,
                total_images=parent_job.total_images,
                eps=eps,
                min_samples=min_samples,
            )

            # Clone images and copy computed embeddings
            for img in parent_job.images.all():
                new_hash = f"{img.image_hash}_{new_job.id.hex[:8]}"
                if len(new_hash) > 64:
                    new_hash = new_hash[-64:]

                UploadedImage.objects.create(
                    job=new_job,
                    image=img.image,
                    image_hash=new_hash,
                    embedding=img.embedding,
                    face_detected=img.face_detected,
                    duplicate=img.duplicate,
                    processing_status=ImageProcessingStatus.PENDING,
                )

        # Enqueue Celery task for the new job version
        process_job_task.delay(str(new_job.id))

        return Response(
            {
                "job_id": str(new_job.id),
                "status": new_job.status,
                "message": "Re-clustering job version scheduled successfully.",
            },
            status=status.HTTP_201_CREATED,
        )
