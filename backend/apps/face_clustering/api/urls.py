from django.urls import path

from apps.face_clustering.api.views.upload_view import UploadView
from apps.face_clustering.api.views.job_view import JobView
from apps.face_clustering.api.views.cluster_view import ClusterView

app_name = "face_clustering"

urlpatterns = [
    path(
        "upload/",
        UploadView.as_view(),
        name="upload-images",
    ),
    path(
        "jobs/<uuid:job_id>/",
        JobView.as_view(),
        name="job-detail",
    ),
    path(
        "jobs/<uuid:job_id>/clusters/",
        ClusterView.as_view(),
        name="cluster-results",
    ),
]