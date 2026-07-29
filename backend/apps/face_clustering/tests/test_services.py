from io import BytesIO
import zipfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from unittest.mock import patch

from apps.face_clustering.common.hash_service import HashService
from apps.face_clustering.models.processing_job import ProcessingJob
from apps.face_clustering.models.uploaded_image import UploadedImage
from apps.face_clustering.services.image_upload_service import (
    ImageUploadService,
)
from apps.face_clustering.services.zip_upload_service import (
    ZipUploadService,
)


PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
    b"\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00"
    b"\x90wS\xde\x00\x00\x00\x0cIDAT\x08\x99c``\x00\x00\x00"
    b"\x04\x00\x01\xf6\x178U\x00\x00\x00\x00IEND\xaeB`\x82"
)


@override_settings(MEDIA_ROOT="D:/MITTAL/Krishvatech/face-clustering-system/backend/test_media")
class ImageUploadServiceTests(TestCase):

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

    @patch("apps.face_clustering.services.image_upload_service.process_job_task.delay")
    def test_upload_creates_job_and_images(self, mock_delay):
        job = ImageUploadService().upload(
            [
                self.make_image_upload("first.png"),
                self.make_image_upload(
                    "second.png",
                    PNG_BYTES + b"extra",
                ),
            ]
        )

        self.assertEqual(job.total_images, 2)
        self.assertEqual(UploadedImage.objects.filter(job=job).count(), 2)
        mock_delay.assert_called_once_with(str(job.id))

    @patch("apps.face_clustering.services.image_upload_service.process_job_task.delay")
    def test_upload_skips_duplicate_hashes(self, mock_delay):
        existing_job = ProcessingJob.objects.create(total_images=1)

        existing = UploadedImage(
            job=existing_job,
            image_hash="",
        )
        existing.image.save(
            "existing.png",
            self.make_image_upload("existing.png"),
            save=False,
        )
        existing.image_hash = HashService.calculate_bytes_sha256(
            PNG_BYTES
        )
        existing.save()

        job = ImageUploadService().upload(
            [
                self.make_image_upload("duplicate-db.png"),
                self.make_image_upload("duplicate-batch-a.png"),
                self.make_image_upload("duplicate-batch-b.png"),
                self.make_image_upload(
                    "unique.png",
                    PNG_BYTES + b"extra",
                ),
            ]
        )

        self.assertEqual(job.total_images, 1)
        self.assertEqual(UploadedImage.objects.filter(job=job).count(), 1)
        mock_delay.assert_called_once_with(str(job.id))


@override_settings(MEDIA_ROOT="D:/MITTAL/Krishvatech/face-clustering-system/backend/test_media")
class ZipUploadServiceTests(TestCase):

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
    def test_upload_creates_job_and_images(self, mock_delay):
        uploaded_zip = self.make_zip_upload(
            {
                "first.png": PNG_BYTES,
                "nested/second.png": PNG_BYTES + b"extra",
                "notes.txt": b"ignore",
            }
        )

        job = ZipUploadService().upload(uploaded_zip)

        self.assertEqual(job.total_images, 2)
        self.assertEqual(UploadedImage.objects.filter(job=job).count(), 2)
        mock_delay.assert_called_once_with(str(job.id))

    @patch("apps.face_clustering.services.zip_upload_service.process_job_task.delay")
    def test_upload_skips_duplicate_hashes(self, mock_delay):
        uploaded_zip = self.make_zip_upload(
            {
                "first.png": PNG_BYTES,
                "nested/first-copy.png": PNG_BYTES,
                "nested/second.png": PNG_BYTES + b"extra",
            }
        )

        job = ZipUploadService().upload(uploaded_zip)

        self.assertEqual(job.total_images, 2)
        self.assertEqual(UploadedImage.objects.filter(job=job).count(), 2)
        mock_delay.assert_called_once_with(str(job.id))

    def test_upload_raises_for_zip_without_supported_images(self):
        uploaded_zip = self.make_zip_upload(
            {
                "notes.txt": b"ignore",
            }
        )

        with self.assertRaisesMessage(
            ValueError,
            "No supported images found inside ZIP.",
        ):
            ZipUploadService().upload(uploaded_zip)
