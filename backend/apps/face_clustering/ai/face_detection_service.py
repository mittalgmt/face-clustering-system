"""
InsightFace Detection Service.
"""

from __future__ import annotations

import threading

import cv2
import numpy as np
from insightface.app import FaceAnalysis

from django.conf import settings

from apps.face_clustering.utils.exceptions import NoFaceDetectedException


class FaceDetectionService:
    """
    Singleton InsightFace detector.
    """

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):

        if cls._instance is None:

            with cls._lock:

                if cls._instance is None:

                    cls._instance = super().__new__(cls)

                    cls._instance._initialize()

        return cls._instance

    def _initialize(self):

        self.model = FaceAnalysis(
            name=settings.INSIGHTFACE_MODEL_NAME,
            root=str(settings.INSIGHTFACE_MODEL_ROOT),
            providers=settings.ONNX_PROVIDER,
        )

        self.model.prepare(
            ctx_id=0,
            det_size=(640, 640),
        )

    def detect(self, image_path: str):

        image = cv2.imread(image_path)

        if image is None:
            raise ValueError("Unable to load image.")

        faces = self.model.get(image)

        if not faces:
            raise NoFaceDetectedException()

        largest = max(
            faces,
            key=lambda f:
            (f.bbox[2] - f.bbox[0]) *
            (f.bbox[3] - f.bbox[1])
        )

        return largest