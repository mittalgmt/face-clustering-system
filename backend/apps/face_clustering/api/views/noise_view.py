from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.face_clustering.models.uploaded_image import UploadedImage, ImageProcessingStatus
from apps.face_clustering.repositories.job_repository import JobRepository


class NoiseView(APIView):
    """
    Retrieve noise / unclustered images for a processing job.
    """

    def get(self, request, job_id):
        job = JobRepository.get_by_id(job_id)

        if job is None:
            return Response(
                {"detail": "Job not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Get all images belonging to the job that are NOT mapped to any cluster
        images = UploadedImage.objects.filter(job=job, cluster_info__isnull=True)

        data = []
        for img in images:
            # Determine reason
            if img.duplicate:
                reason = "Duplicate image (already processed)"
            elif img.processing_status == ImageProcessingStatus.NO_FACE:
                reason = "No face detected"
            elif img.processing_status == ImageProcessingStatus.FAILED:
                reason = f"Processing failed: {img.error_message or 'Unknown error'}"
            else:
                reason = "Outlier (no matching face clusters found)"

            data.append({
                "id": str(img.id),
                "filename": img.image.name,
                "status": img.processing_status,
                "reason": reason,
            })

        return Response(data, status=status.HTTP_200_OK)
