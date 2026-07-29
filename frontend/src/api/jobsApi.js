import api from './axios'

/**
 * Fetch the current status and progress of a processing job.
 * @param {string} jobId - UUID
 * @returns {Promise<{id, status, progress, total_images, total_clusters, created_at, completed_at}>}
 */
export async function getJob(jobId) {
  const response = await api.get(`jobs/${jobId}/`)
  return response.data
}
