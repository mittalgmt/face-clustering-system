from django.urls import path

from apps.face_clustering.api.views.upload_view import UploadView

urlpatterns = [
    path(
        "upload/",
        UploadView.as_view(),
        name="upload-images",
    ),
]