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

/**
 * Fetch all processing jobs in the database.
 * @returns {Promise<Array>}
 */
export async function getJobs() {
  const response = await api.get('jobs/')
  return response.data
}

/**
 * Delete a processing job and all related data/files.
 * @param {string} jobId - UUID
 */
export async function deleteJob(jobId) {
  const response = await api.delete(`jobs/${jobId}/`)
  return response.data
}

/**
 * Trigger re-clustering on a job.
 * @param {string} jobId - UUID
 */
export async function reclusterJob(jobId) {
  const response = await api.post(`jobs/${jobId}/recluster/`)
  return response.data
}

/**
 * Download clustered results ZIP.
 * @param {string} jobId - UUID
 */
export async function downloadJobResults(jobId) {
  const response = await api.get(`jobs/${jobId}/download/`, {
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `job_${jobId.slice(0, 8)}_results.zip`)
  document.body.appendChild(link)
  link.click()
  link.remove()
}
