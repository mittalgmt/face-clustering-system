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
  const [jobName, setJobName] = useState("")

  const handleFiles = async (files) => {
    setDuplicateInfo(null)
    
    // Deduce name to use
    let nameToUse = jobName.trim()
    if (!nameToUse && files.length > 0) {
      const firstFile = files[0]
      if (firstFile.name.toLowerCase().endsWith('.zip')) {
        nameToUse = firstFile.name.replace(/\.[^/.]+$/, "")
      } else {
        nameToUse = "Face Clustering Run"
      }
    }
    if (!nameToUse) {
      nameToUse = "Face Clustering Run"
    }

    const result = await upload(files)

    if (!result) return // upload error — shown by hook

    // Store the custom name mapping
    const existing = JSON.parse(localStorage.getItem('faceClusterCustomNames') || '{}')
    existing[result.job_id] = nameToUse
    localStorage.setItem('faceClusterCustomNames', JSON.stringify(existing))

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

        {/* How it Works Guide Grid */}
        <div className="upload-guide-grid animate-fade-in-up" style={{ animationDelay: '60ms', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)', margin: 'var(--space-xl) 0 var(--space-lg) 0' }}>
          <div className="glass-card" style={{ padding: 'var(--space-md)', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>📤</span>
            <strong style={{ fontSize: 'var(--text-sm)' }}>1. Select Photos</strong>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Drag & drop image files or a folder ZIP archive. Duplicates are auto-skipped.</span>
          </div>
          <div className="glass-card" style={{ padding: 'var(--space-md)', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>⚙️</span>
            <strong style={{ fontSize: 'var(--text-sm)' }}>2. AI Matching Scan</strong>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>AI models crop faces and compute embedding vectors in the background.</span>
          </div>
          <div className="glass-card" style={{ padding: 'var(--space-md)', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>👥</span>
            <strong style={{ fontSize: 'var(--text-sm)' }}>3. Organize Clusters</strong>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Explore generated face profiles, rename directories, and export ZIPs.</span>
          </div>
        </div>

        {/* Stepper */}
        <div className="upload-stepper animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <ProgressStepper currentStep="upload" />
        </div>

        {/* Upload Zone */}
        <div className="upload-zone-container animate-fade-in-up" style={{ animationDelay: '160ms' }}>
          {/* Custom Job Name Input */}
          <div className="upload-job-name-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px', textAlign: 'left' }}>
            <label htmlFor="job-custom-name-field" style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
              📁 Custom Job Name (Optional)
            </label>
            <input
              id="job-custom-name-field"
              type="text"
              className="upload-job-name-input"
              placeholder="E.g., Graduation 2026, Wedding Photos... (Defaults to ZIP filename if left empty)"
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
              disabled={uploading}
            />
          </div>

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
        <div className="upload-tips animate-fade-in-up" style={{ animationDelay: '200ms', padding: 'var(--space-xl)', background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <h2 className="upload-tips-title" style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-md)', textAlign: 'left', fontWeight: 700 }}>📋 Dataset Guidelines & Parameters</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)', textAlign: 'left' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>Supported Formats</strong>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Standard images (JPG, PNG, WEBP, BMP) up to 10MB each.</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>ZIP Archives</strong>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Compress your images into a single ZIP archive up to 500MB.</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>Batch Limits</strong>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Maximum 500 images per processing job to ensure optimal GPU loads.</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>Duplicate Detection</strong>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Identical file hashes are skipped automatically to save embedding costs.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
