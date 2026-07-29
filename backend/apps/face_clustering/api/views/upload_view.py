from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.face_clustering.api.serializers.upload_serializer import UploadSerializer
from apps.face_clustering.services.image_upload_service import (
    ImageUploadService,
)
from apps.face_clustering.services.zip_upload_service import (
    ZipUploadService,
)


class UploadView(APIView):
    """
    Upload images and create a processing job.
    """

    serializer_class = UploadSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        if "zip_file" in serializer.validated_data:

            job = ZipUploadService().upload(
                serializer.validated_data["zip_file"]
            )

        else:

            job = ImageUploadService().upload(
                serializer.validated_data["images"]
            )

        return Response(
            {
                "job_id": str(job.id),
                "status": job.status,
                "total_images": job.total_images,
                "message": "Upload successful.",
            },
            status=status.HTTP_201_CREATED,
        )
