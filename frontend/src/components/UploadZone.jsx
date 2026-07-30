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
 * Prevents duplicate file selections within the same job upload.
 * @param {{ onFiles: (files: File[]) => void, disabled: boolean }} props
 */
export default function UploadZone({ onFiles, disabled }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [validationError, setValidationError] = useState(null)
  const [duplicateWarning, setDuplicateWarning] = useState(null)

  // Track all preview URLs for clean-up on unmount to prevent leaks
  const previewsRef = useRef([])
  useEffect(() => {
    previewsRef.current = previews
  }, [previews])

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((p) => {
        if (p.url) URL.revokeObjectURL(p.url)
      })
    }
  }, [])

  const processFiles = useCallback((rawFiles) => {
    const files = Array.from(rawFiles)
    setValidationError(null)
    setDuplicateWarning(null)

    if (files.length === 0) return

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

    // Detect and filter duplicates within the current selected files list (comparing name + size)
    const seen = new Set()
    const uniqueFiles = []
    const duplicateNames = []

    for (const f of files) {
      const key = `${f.name}-${f.size}`
      if (seen.has(key)) {
        duplicateNames.push(f.name)
      } else {
        seen.add(key)
        uniqueFiles.push(f)
      }
    }

    if (duplicateNames.length > 0) {
      setDuplicateWarning(
        `Skipped ${duplicateNames.length} duplicate file(s) in this selection: ${duplicateNames.slice(0, 3).join(', ')}${duplicateNames.length > 3 ? '...' : ''}`
      )
    }

    if (uniqueFiles.length > MAX_IMAGES) {
      setValidationError(`Maximum ${MAX_IMAGES} images allowed.`)
      return
    }

    const oversized = uniqueFiles.filter((f) => f.size > 10 * 1024 * 1024)
    if (oversized.length > 0) {
      setValidationError(`${oversized[0].name} exceeds the 10 MB limit.`)
      return
    }

    setSelectedFiles(uniqueFiles)
    
    // Create preview URLs for the first 20 images
    const previewUrls = uniqueFiles.slice(0, 20).map((file) => ({
      id: `${file.name}-${file.size}`,
      url: URL.createObjectURL(file),
      file: file
    }))
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

  const handleDragOver = (e) => {
    e.preventDefault()
    if (!disabled) setDragging(true)
  }
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
    // Revoke all preview URLs
    previews.forEach((p) => URL.revokeObjectURL(p.url))
    setSelectedFiles([])
    setPreviews([])
    setValidationError(null)
    setDuplicateWarning(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleRemoveImage = (previewId, e) => {
    e.stopPropagation()
    // Revoke object URL for the removed preview item
    const target = previews.find((p) => p.id === previewId)
    if (target) URL.revokeObjectURL(target.url)

    const updatedPreviews = previews.filter((p) => p.id !== previewId)
    setPreviews(updatedPreviews)

    const updatedFiles = selectedFiles.filter((f) => `${f.name}-${f.size}` !== previewId)
    setSelectedFiles(updatedFiles)

    // Reset validations and warnings if zero files remain
    if (updatedFiles.length === 0) {
      setValidationError(null)
      setDuplicateWarning(null)
      if (inputRef.current) inputRef.current.value = ''
    }
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
                disabled={disabled}
              >
                ✕
              </button>
            </div>

            {/* Horizontal scroll grid of selected image previews */}
            {!isZip && previews.length > 0 && (
              <div className="upload-previews-carousel">
                {previews.map((p, i) => (
                  <div key={p.id} className="upload-preview-item">
                    <img src={p.url} alt={`preview-${i}`} />
                    {!disabled && (
                      <button
                        className="upload-preview-remove-btn"
                        onClick={(e) => handleRemoveImage(p.id, e)}
                        title="Remove image"
                        aria-label={`Remove ${p.file.name}`}
                      >
                        ✕
                      </button>
                    )}
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

      {duplicateWarning && (
        <div className="upload-warning" role="alert">
          💡 {duplicateWarning}
        </div>
      )}

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
