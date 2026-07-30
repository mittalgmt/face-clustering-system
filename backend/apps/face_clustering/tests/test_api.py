from io import BytesIO
import zipfile
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.face_clustering.models import ProcessingJob


PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
    b"\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00"
    b"\x90wS\xde\x00\x00\x00\x0cIDAT\x08\x99c``\x00\x00\x00"
    b"\x04\x00\x01\xf6\x178U\x00\x00\x00\x00IEND\xaeB`\x82"
)


@override_settings(MEDIA_ROOT="D:/MITTAL/Krishvatech/face-clustering-system/backend/test_media")
class UploadApiTests(APITestCase):

    def make_image_upload(
        self,
        name: str,
        content: bytes = PNG_BYTES,
    ):
        return SimpleUploadedFile(
            name,
            content,
            content_type="image/png",
        )

    def make_zip_upload(self, files):
        buffer = BytesIO()

        with zipfile.ZipFile(buffer, "w") as archive:
            for name, content in files.items():
                archive.writestr(name, content)

        buffer.seek(0)

        return SimpleUploadedFile(
            "images.zip",
            buffer.getvalue(),
            content_type="application/zip",
        )

    @patch("apps.face_clustering.services.zip_upload_service.process_job_task.delay")
    def test_zip_upload_uses_service_flow(self, mock_delay):
        uploaded_zip = self.make_zip_upload(
            {
                "first.png": PNG_BYTES,
            }
        )

        response = self.client.post(
            "/api/v1/upload/",
            {"zip_file": uploaded_zip},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["message"], "Upload successful.")
        self.assertEqual(response.data["total_images"], 1)
        self.assertEqual(response.data["status"], "PENDING")
        self.assertIn("job_id", response.data)
        mock_delay.assert_called_once()

    @patch("apps.face_clustering.services.image_upload_service.process_job_task.delay")
    def test_image_upload_uses_service_flow(self, mock_delay):
        response = self.client.post(
            "/api/v1/upload/",
            {
                "images": [
                    self.make_image_upload("first.png"),
                ],
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["message"], "Upload successful.")
        self.assertEqual(response.data["total_images"], 1)
        self.assertEqual(response.data["status"], "PENDING")
        self.assertIn("job_id", response.data)
        mock_delay.assert_called_once()

    def test_completed_job_download_uses_uuid_filename_prefix(self):
        job = ProcessingJob.objects.create(status="COMPLETED")

        response = self.client.get(f"/api/v1/jobs/{job.id}/download/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/zip")
        self.assertEqual(
            response["Content-Disposition"],
            f'attachment; filename="job_{job.id.hex[:8]}_results.zip"',
        )
