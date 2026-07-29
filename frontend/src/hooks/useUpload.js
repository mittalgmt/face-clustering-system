import { useState, useCallback } from 'react'
import { uploadImages, uploadZip } from '../api/uploadApi'

const HISTORY_KEY = 'faceClusterHistory'

function saveToHistory(job) {
  try {
    const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    const updated = [job, ...existing.filter((j) => j.job_id !== job.job_id)]
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated.slice(0, 50)))
  } catch {
    // silently fail if storage is full
  }
}

/**
 * Manages image upload state.
 * Returns { uploading, uploadProgress, error, upload }
 */
export function useUpload() {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState(null)

  const upload = useCallback(async (files) => {
    setUploading(true)
    setError(null)
    setUploadProgress(0)

    const onUploadProgress = (evt) => {
      if (evt.total) {
        setUploadProgress(Math.round((evt.loaded / evt.total) * 100))
      }
    }

    try {
      let result
      // Detect ZIP upload
      if (files.length === 1 && files[0].name.toLowerCase().endsWith('.zip')) {
        result = await uploadZip(files[0], onUploadProgress)
      } else {
        result = await uploadImages(Array.from(files), onUploadProgress)
      }

      saveToHistory({
        job_id: result.job_id,
        status: result.status,
        total_images: result.total_images,
        total_clusters: 0,
        created_at: new Date().toISOString(),
      })

      return result
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setUploading(false)
    }
  }, [])

  return { uploading, uploadProgress, error, upload }
}
