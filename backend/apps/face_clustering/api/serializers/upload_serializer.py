from rest_framework import serializers


class UploadSerializer(serializers.Serializer):
    """
    Serializer for uploading images or a ZIP archive.
    """

    images = serializers.ListField(
        child=serializers.ImageField(),
        required=False,
        allow_empty=False,
        write_only=True,
    )

    zip_file = serializers.FileField(
        required=False,
        write_only=True,
    )

    MAX_IMAGES = 500
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
    MAX_ZIP_SIZE = 500 * 1024 * 1024  # 500 MB

    def validate(self, attrs):
        """
        Ensure either images or a ZIP is uploaded.
        """

        images = attrs.get("images")
        zip_file = attrs.get("zip_file")

        if not images and not zip_file:
            raise serializers.ValidationError(
                "Upload either images or a ZIP file."
            )

        if images and zip_file:
            raise serializers.ValidationError(
                "Upload either images or a ZIP file, not both."
            )

        return attrs

    def validate_images(self, images):
        """
        Validate uploaded images.
        """

        if len(images) > self.MAX_IMAGES:
            raise serializers.ValidationError(
                f"Maximum {self.MAX_IMAGES} images are allowed."
            )

        for image in images:
            if image.size > self.MAX_FILE_SIZE:
                raise serializers.ValidationError(
                    f"{image.name} exceeds the 10 MB limit."
                )

        return images

    def validate_zip_file(self, zip_file):
        """
        Validate uploaded ZIP archive.
        """

        if not zip_file.name.lower().endswith(".zip"):
            raise serializers.ValidationError(
                "Only ZIP files are supported."
            )

        if zip_file.size > self.MAX_ZIP_SIZE:
            raise serializers.ValidationError(
                "ZIP file exceeds the 500 MB limit."
            )

        return zip_file