from rest_framework import serializers


class UploadSerializer(serializers.Serializer):
    """
    Serializer for uploading multiple images.
    """

    images = serializers.ListField(
        child=serializers.ImageField(),
        allow_empty=False,
        write_only=True,
    )

    def validate_images(self, images):
        """
        Validate uploaded images.
        """

        if not images:
            raise serializers.ValidationError(
                "At least one image is required."
            )

        MAX_IMAGES = 500

        if len(images) > MAX_IMAGES:
            raise serializers.ValidationError(
                f"Maximum {MAX_IMAGES} images are allowed."
            )

        MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

        for image in images:
            if image.size > MAX_FILE_SIZE:
                raise serializers.ValidationError(
                    f"{image.name} exceeds the 10 MB limit."
                )

        return images