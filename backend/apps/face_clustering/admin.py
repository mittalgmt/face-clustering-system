from django.contrib import admin

from .models import (
    ProcessingJob,
    UploadedImage,
    Cluster,
    ClusterImage,
)


# -----------------------------
# Processing Job
# -----------------------------
@admin.register(ProcessingJob)
class ProcessingJobAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "status",
        "progress",
        "total_images",
        "total_clusters",
        "completed_at",
    )


# -----------------------------
# Uploaded Image
# -----------------------------
@admin.register(UploadedImage)
class UploadedImageAdmin(admin.ModelAdmin):
    list_display = (
        "image_name",
        "processing_status",
        "face_detected",
        "duplicate",
    )

    @admin.display(description="Image")
    def image_name(self, obj):
        return obj.image.name.split("/")[-1]


# -----------------------------
# Cluster Images Inline
# -----------------------------
class ClusterImageInline(admin.TabularInline):
    model = ClusterImage
    extra = 0

    fields = (
        "image",
        "confidence",
        "distance_to_centroid",
    )

    readonly_fields = (
        "image",
        "confidence",
        "distance_to_centroid",
    )

    can_delete = False


# -----------------------------
# Cluster
# -----------------------------
@admin.register(Cluster)
class ClusterAdmin(admin.ModelAdmin):
    list_display = (
        "job",
        "cluster_number",
        "image_count",
    )

    inlines = [ClusterImageInline]


# -----------------------------
# Cluster Image
# -----------------------------
@admin.register(ClusterImage)
class ClusterImageAdmin(admin.ModelAdmin):
    list_display = (
        "cluster",
        "image_name",
        "confidence",
        "distance_to_centroid",
    )

    @admin.display(description="Image")
    def image_name(self, obj):
        return obj.image.image.name.split("/")[-1]