from django.contrib import admin

from .models import (
    ProcessingJob,
    UploadedImage,
    Cluster,
    ClusterImage,
)

admin.site.register(ProcessingJob)
admin.site.register(UploadedImage)
admin.site.register(Cluster)
admin.site.register(ClusterImage)