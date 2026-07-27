from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.face_clustering.api.serializers.upload_serializer import UploadSerializer
from apps.face_clustering.models.uploaded_image import UploadedImage
from apps.face_clustering.repositories.image_repository import ImageRepository
from apps.face_clustering.repositories.job_repository import JobRepository
from apps.face_clustering.tasks.processing_tasks import process_job_task


class UploadView(APIView):
    """
    Upload images and create a processing job.
    """

    serializer_class = UploadSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        uploaded_files = serializer.validated_data["images"]

        with transaction.atomic():
            job = JobRepository.create_job(
                total_images=len(uploaded_files)
            )

            images = [
                UploadedImage(
                    job=job,
                    image=file,
                )
                for file in uploaded_files
            ]

            ImageRepository.bulk_create(images)

        process_job_task.delay(str(job.id))

        return Response(
            {
                "job_id": str(job.id),
                "status": job.status,
                "total_images": job.total_images,
                "message": "Images uploaded successfully.",
            },
            status=status.HTTP_201_CREATED,
        )