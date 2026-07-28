"""
Custom exceptions used throughout the Face Clustering application.
"""


class FaceClusteringException(Exception):
    """Base exception for the Face Clustering application."""
    pass


class NoFaceDetectedException(FaceClusteringException):
    """Raised when no face is detected in an image."""
    pass


class MultipleFacesDetectedException(FaceClusteringException):
    """Raised when multiple faces are detected but only one is expected."""
    pass


class InvalidImageException(FaceClusteringException):
    """Raised when an uploaded image is invalid or cannot be processed."""
    pass


class FaceEmbeddingException(FaceClusteringException):
    """Raised when face embedding generation fails."""
    pass


class ClusteringException(FaceClusteringException):
    """Raised when clustering fails."""
    pass