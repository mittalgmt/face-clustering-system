import api from './axios'

/**
 * Fetch all clusters for a completed processing job.
 * @param {string} jobId - UUID
 * @returns {Promise<Array<{id, cluster_number, image_count, images}>>}
 */
export async function getClusters(jobId) {
  const response = await api.get(`jobs/${jobId}/clusters/`)
  return response.data
}

/**
 * Fetch all noise/unclustered images for a processing job.
 * @param {string} jobId - UUID
 * @returns {Promise<Array<{id, filename, status, reason}>>}
 */
export async function getNoise(jobId) {
  const response = await api.get(`jobs/${jobId}/noise/`)
  return response.data
}

/**
 * Build the full media URL for an image.
 * The backend serializer returns the full relative path from MEDIA_ROOT,
 * e.g. "uploads/2026/07/29/img_026.jpg"
 * We prepend /media/ which is proxied by Vite to Django.
 * @param {string} imagePath - relative path from MEDIA_ROOT
 */
export function getImageUrl(imagePath) {
  return `/media/${imagePath}`
}
