import { useRef, useState, useCallback, useEffect } from 'react'
import './UploadZone.css'

const ACCEPTED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.bmp', '.webp']
const MAX_IMAGES = 500

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getTotalSize(files) {
  return Array.from(files).reduce((sum, f) => sum + f.size, 0)
}

/**
 * Drag-and-drop upload zone.
 * Accepts images (jpg, jpeg, png, bmp, webp) or a single ZIP file.
 * Displays horizontal scrolling thumbnails of selected images for a gorgeous preview.
 * @param {{ onFiles: (files: File[]) => void, disabled: boolean }} props
 */
export default function UploadZone({ onFiles, disabled }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [validationError, setValidationError] = useState(null)

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previews])

  const processFiles = useCallback((rawFiles) => {
    const files = Array.from(rawFiles)
    setValidationError(null)

    // ZIP case
    if (files.length === 1 && files[0].name.toLowerCase().endsWith('.zip')) {
      if (files[0].size > 500 * 1024 * 1024) {
        setValidationError('ZIP file must be under 500 MB.')
        return
      }
      setSelectedFiles(files)
      setPreviews([])
      return
    }

    // Image files case
    const invalid = files.filter(
      (f) => !ACCEPTED_IMAGE_TYPES.some((ext) => f.name.toLowerCase().endsWith(ext))
    )
    if (invalid.length > 0) {
      setValidationError(`Unsupported file type: ${invalid[0].name}`)
      return
    }
    if (files.length > MAX_IMAGES) {
      setValidationError(`Maximum ${MAX_IMAGES} images allowed.`)
      return
    }
    const oversized = files.filter((f) => f.size > 10 * 1024 * 1024)
    if (oversized.length > 0) {
      setValidationError(`${oversized[0].name} exceeds the 10 MB limit.`)
      return
    }

    setSelectedFiles(files)
    // Create preview URLs for the first 12 images
    const previewUrls = files.slice(0, 12).map((file) => URL.createObjectURL(file))
    setPreviews(previewUrls)
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragging(false)
      if (disabled) return
      processFiles(e.dataTransfer.files)
    },
    [disabled, processFiles]
  )

  const handleDragOver = (e) => { e.preventDefault(); if (!disabled) setDragging(true) }
  const handleDragLeave = () => setDragging(false)

  const handleChange = (e) => {
    if (e.target.files?.length) processFiles(e.target.files)
  }

  const handleClick = () => {
    if (!disabled) inputRef.current?.click()
  }

  const handleUpload = () => {
    if (selectedFiles.length > 0 && onFiles) {
      onFiles(selectedFiles)
    }
  }

  const clearFiles = (e) => {
    e.stopPropagation()
    setSelectedFiles([])
    setPreviews([])
    setValidationError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const isZip = selectedFiles.length === 1 && selectedFiles[0]?.name?.endsWith('.zip')
  const hasFiles = selectedFiles.length > 0

  return (
    <div className="upload-zone-wrapper">
      <div
        id="upload-drop-zone"
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload images or ZIP file"
        className={`upload-zone ${dragging ? 'upload-zone--dragging' : ''} ${disabled ? 'upload-zone--disabled' : ''} ${hasFiles ? 'upload-zone--filled' : ''}`}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      >
        <input
          ref={inputRef}
          type="file"
          id="upload-file-input"
          multiple
          accept={[...ACCEPTED_IMAGE_TYPES, '.zip'].join(',')}
          onChange={handleChange}
          className="upload-zone-input"
          aria-hidden="true"
        />

        {!hasFiles ? (
          <>
            <div className="upload-zone-icon" aria-hidden="true">
              <span className="upload-zone-icon-inner">↑</span>
            </div>
            <h3 className="upload-zone-title">Drop images or ZIP here</h3>
            <p className="upload-zone-subtitle">
              or <span className="upload-zone-link">click to browse</span>
            </p>
            <div className="upload-zone-hints">
              <span>JPG · PNG · BMP · WEBP · ZIP</span>
              <span>·</span>
              <span>Max 500 images · 10 MB each</span>
            </div>
          </>
        ) : (
          <div className="upload-zone-preview" onClick={(e) => e.stopPropagation()}>
            <div className="upload-preview-header">
              <div className="upload-preview-icon" aria-hidden="true">
                {isZip ? '🗜' : '🖼'}
              </div>
              <div className="upload-preview-info">
                {isZip ? (
                  <span className="upload-preview-name">{selectedFiles[0].name}</span>
                ) : (
                  <span className="upload-preview-name">
                    {selectedFiles.length} image{selectedFiles.length !== 1 ? 's' : ''} selected
                  </span>
                )}
                <span className="upload-preview-size">
                  {formatBytes(getTotalSize(selectedFiles))}
                </span>
              </div>
              <button
                id="clear-files-btn"
                className="upload-clear-btn"
                onClick={clearFiles}
                title="Remove files"
                aria-label="Remove selected files"
              >
                ✕
              </button>
            </div>

            {/* Horizontal scroll grid of selected image previews */}
            {!isZip && previews.length > 0 && (
              <div className="upload-previews-carousel">
                {previews.map((url, i) => (
                  <div key={i} className="upload-preview-item">
                    <img src={url} alt={`preview-${i}`} />
                  </div>
                ))}
                {selectedFiles.length > previews.length && (
                  <div className="upload-preview-item upload-preview-more">
                    <span>+{selectedFiles.length - previews.length}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {validationError && (
        <div className="upload-error" role="alert" id="upload-error-msg">
          ⚠ {validationError}
        </div>
      )}

      {hasFiles && !validationError && (
        <button
          id="upload-submit-btn"
          className="btn btn-primary btn-lg upload-submit"
          onClick={handleUpload}
          disabled={disabled}
        >
          {disabled ? (
            <><span className="spinner" />&nbsp;Uploading…</>
          ) : (
            <>↑ &nbsp;Start Clustering</>
          )}
        </button>
      )}
    </div>
  )
}
