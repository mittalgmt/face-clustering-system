import io
import os
import zipfile
from django.http import HttpResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.face_clustering.models.uploaded_image import UploadedImage
from apps.face_clustering.repositories.job_repository import JobRepository


class JobDownloadView(APIView):
    """
    Download a ZIP file containing the clustered face images.
    """

    def get(self, request, job_id):
        job = JobRepository.get_by_id(job_id)

        if job is None:
            return Response(
                {"detail": "Job not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if job.status != "COMPLETED":
            return Response(
                {"detail": "Only completed jobs can be downloaded."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create in-memory ZIP file
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            # 1. Write clusters and their images
            for cluster in job.clusters.all():
                folder_name = f"Cluster_{cluster.cluster_number}"
                for cluster_image in cluster.images.all():
                    img = cluster_image.image
                    if img.image and img.image.storage.exists(img.image.name):
                        filename = os.path.basename(img.image.name)
                        # Read file bytes from storage and write to ZIP
                        with img.image.open("rb") as f:
                            zip_file.writestr(f"{folder_name}/{filename}", f.read())

            # 2. Write Noise / Unclustered images
            noise_images = UploadedImage.objects.filter(job=job, cluster_info__isnull=True)
            for img in noise_images:
                if img.image and img.image.storage.exists(img.image.name):
                    filename = os.path.basename(img.image.name)
                    with img.image.open("rb") as f:
                        zip_file.writestr(f"Noise/{filename}", f.read())

        # Respond with ZIP file
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type="application/zip")
        job_id_prefix = job.id.hex[:8] if hasattr(job.id, "hex") else str(job.id)[:8]
        response["Content-Disposition"] = (
            f'attachment; filename="job_{job_id_prefix}_results.zip"'
        )
        return response
