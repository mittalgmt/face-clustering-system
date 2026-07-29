import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import UploadZone from '../components/UploadZone'
import ProgressStepper from '../components/ProgressStepper'
import { useUpload } from '../hooks/useUpload'
import './Upload.css'

export default function Upload() {
  const navigate = useNavigate()
  const { uploading, uploadProgress, error, upload } = useUpload()
  const [duplicateInfo, setDuplicateInfo] = useState(null) // { job_id, message }

  const handleFiles = async (files) => {
    setDuplicateInfo(null)
    const result = await upload(files)

    if (!result) return // upload error — shown by hook

    // All images were duplicates — backend skipped everything
    if (result.total_images === 0) {
      setDuplicateInfo({
        job_id: result.job_id,
        message: result.message,
      })
      return
    }

    // Normal case — redirect to processing
    navigate(`/processing/${result.job_id}`)
  }

  return (
    <div className="page upload-page">
      <div className="container">

        {/* Header */}
        <div className="upload-header animate-fade-in-up">
          <h1 className="upload-title">
            Upload <span className="text-gradient">Images</span>
          </h1>
          <p className="upload-subtitle">
            Upload individual photos or a ZIP archive to start face clustering.
          </p>
        </div>

        {/* Stepper */}
        <div className="upload-stepper animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <ProgressStepper currentStep="upload" />
        </div>

        {/* Upload Zone */}
        <div className="upload-zone-container animate-fade-in-up" style={{ animationDelay: '160ms' }}>
          <UploadZone onFiles={handleFiles} disabled={uploading} />

          {/* Upload progress during HTTP transfer */}
          {uploading && uploadProgress > 0 && uploadProgress < 100 && (
            <div className="upload-transfer-progress">
              <div className="upload-transfer-label">
                <span>Uploading files…</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {uploading && (
            <div className="upload-status animate-fade-in">
              <span className="spinner" aria-hidden="true" />
              <span>Sending to server and queuing AI processing…</span>
            </div>
          )}

          {/* Duplicate warning banner */}
          {duplicateInfo && !uploading && (
            <div className="upload-duplicate-banner animate-fade-in" role="alert" id="duplicate-warning">
              <div className="upload-duplicate-icon" aria-hidden="true">⚠</div>
              <div className="upload-duplicate-body">
                <p className="upload-duplicate-title">All images already processed</p>
                <p className="upload-duplicate-desc">
                  Every image in this upload was detected as a duplicate — they have already
                  been processed in a previous job. No new clustering was performed.
                </p>
                {duplicateInfo.job_id && (
                  <Link
                    to={`/results/${duplicateInfo.job_id}`}
                    className="btn btn-secondary btn-sm"
                    id="view-existing-results-btn"
                  >
                    View results of this (empty) job →
                  </Link>
                )}
              </div>
            </div>
          )}

          {error && !uploading && (
            <div className="upload-page-error" role="alert">
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="upload-tips animate-fade-in-up" style={{ animationDelay: '240ms' }}>
          <h2 className="upload-tips-title">Tips</h2>
          <ul className="upload-tips-list">
            <li>✓ JPG, PNG, BMP, WEBP — up to 10 MB each</li>
            <li>✓ ZIP archives — up to 500 MB</li>
            <li>✓ Maximum 500 images per job</li>
            <li>⟳ Duplicate images are automatically detected and skipped</li>
            <li>✓ Multiple faces per image are supported</li>
          </ul>
        </div>

      </div>
    </div>
  )
}
