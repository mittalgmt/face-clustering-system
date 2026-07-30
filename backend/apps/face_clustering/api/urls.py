from django.urls import path

from apps.face_clustering.api.views.cluster_view import ClusterView
from apps.face_clustering.api.views.job_view import JobView
from apps.face_clustering.api.views.upload_view import UploadView
from apps.face_clustering.api.views.noise_view import NoiseView
from apps.face_clustering.api.views.job_list_view import JobListView
from apps.face_clustering.api.views.job_recluster_view import JobReclusterView
from apps.face_clustering.api.views.job_download_view import JobDownloadView

urlpatterns = [
    path(
        "upload/",
        UploadView.as_view(),
        name="upload-images",
    ),
    path(
        "jobs/",
        JobListView.as_view(),
        name="job-list",
    ),
    path(
        "jobs/<uuid:job_id>/",
        JobView.as_view(),
        name="job-detail",
    ),
    path(
        "jobs/<uuid:job_id>/recluster/",
        JobReclusterView.as_view(),
        name="job-recluster",
    ),
    path(
        "jobs/<uuid:job_id>/download/",
        JobDownloadView.as_view(),
        name="job-download",
    ),
    path(
        "jobs/<uuid:job_id>/clusters/",
        ClusterView.as_view(),
        name="job-clusters",
    ),
    path(
        "jobs/<uuid:job_id>/noise/",
        NoiseView.as_view(),
        name="job-noise",
    ),
]
