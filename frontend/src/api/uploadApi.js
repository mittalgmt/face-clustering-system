import api from './axios'

/**
 * Upload individual image files.
 * @param {File[]} files
 * @param {function} onUploadProgress - optional progress callback
 * @returns {Promise<{job_id, status, total_images, message}>}
 */
export async function uploadImages(files, onUploadProgress) {
  const formData = new FormData()
  files.forEach((file) => formData.append('images', file))

  const response = await api.post('upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  })

  return response.data
}

/**
 * Upload a ZIP archive.
 * @param {File} zipFile
 * @param {function} onUploadProgress - optional progress callback
 * @returns {Promise<{job_id, status, total_images, message}>}
 */
export async function uploadZip(zipFile, onUploadProgress) {
  const formData = new FormData()
  formData.append('zip_file', zipFile)

  const response = await api.post('upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  })

  return response.data
}
