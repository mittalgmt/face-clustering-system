/**
 * Compile technical errors into user-friendly messages with action suggestions.
 * @param {Error|object|string} error - The caught error object
 * @returns {{ message: string, suggestion: string }}
 */
export function getFriendlyErrorMessage(error) {
  if (!error) {
    return {
      message: "An unexpected error occurred.",
      suggestion: "Please try refreshing the page or try again."
    }
  }

  const message = error.message || String(error)
  const status = error.response?.status

  // Network connection failures
  if (
    message.includes("Network Error") || 
    message.includes("ERR_NETWORK") || 
    message.includes("Failed to fetch") ||
    message.includes("network")
  ) {
    return {
      message: "Unable to establish connection with the backend server.",
      suggestion: "Please ensure the Django backend server is running on localhost:8000 and verify your internet connection is active."
    }
  }

  // HTTP status code mappings
  if (status === 404) {
    return {
      message: "The requested job run or face cluster could not be found.",
      suggestion: "This item might have been deleted. Verify that the URL is correct or go back to your history dashboard."
    }
  }

  if (status === 403 || status === 401) {
    return {
      message: "Access denied. You do not have permission to view or modify this resource.",
      suggestion: "Try refreshing your session or logging in again."
    }
  }

  if (status >= 500) {
    return {
      message: "The server encountered an unexpected error processing your request.",
      suggestion: "This typically occurs if images contain corrupted metadata or face crops fail. Try re-uploading clean images or reducing DBSCAN Epsilon radius."
    }
  }

  // Specific application constraints
  const lowerMsg = message.toLowerCase()

  if (lowerMsg.includes("no face detected") || lowerMsg.includes("failed to detect face")) {
    return {
      message: "No faces were identified in your uploaded dataset.",
      suggestion: "Please check that your images are clear, faces are not obstructed (e.g., hidden by sunglasses or hands), and are under 5MB each."
    }
  }

  if (lowerMsg.includes("re-clustering") || lowerMsg.includes("recluster")) {
    return {
      message: "The re-clustering execution request was rejected.",
      suggestion: "Double-check your DBSCAN epsilon radius parameter (try raising it above 0.3) or ensure you have at least 2 images."
    }
  }

  if (lowerMsg.includes("format") || lowerMsg.includes("unsupported")) {
    return {
      message: "Unsupported file format upload detected.",
      suggestion: "Please use standard image formats like JPG, JPEG, PNG, or WEBP."
    }
  }

  return {
    message: message || "An unexpected error occurred.",
    suggestion: "Please try again. If the problem persists, try resetting your customized edits layout."
  }
}
