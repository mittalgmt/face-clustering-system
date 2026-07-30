import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import ClusterGrid from '../components/ClusterGrid'
import ProgressStepper from '../components/ProgressStepper'
import { getClusters, getNoise, getImageUrl } from '../api/clustersApi'
import { getJob, downloadJobResults, reclusterJob } from '../api/jobsApi'
import { useToast } from '../context/ToastContext'
import { getFriendlyErrorMessage } from '../utils/errors'
import './Results.css'

const FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect fill='%230d1424' width='80' height='80'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='28' fill='%234b5a73'%3E👤%3C/text%3E%3C/svg%3E"

function getReviewSuggestions(status, reason) {
  if (status === 'FAILED') {
    return [
      'Corrupted image file',
      'Unsupported format (.heic, .tiff, etc.)',
      'File size too large or upload interrupted'
    ]
  }
  if (status === 'NO_FACE') {
    return [
      'Side profile or face turned away',
      'Face partially hidden (hair, hand, mask)',
      'Low lighting or heavy shadow highlights',
      'Face too far away or out of focus'
    ]
  }
  if (reason && reason.toLowerCase().includes('duplicate')) {
    return [
      'Identical file name and size',
      'Already processed in this or a past run'
    ]
  }
  // Outliers
  return [
    'Blurry image or motion blur',
    'Side profile (insufficient face angles)',
    'Face partially hidden (sunglasses, hat, hair)',
    'Low lighting (under-exposed face details)'
  ]
}

function ReviewCard({ item, onImageClick }) {
  const isNoFace = item.status === 'NO_FACE'
  const isFailed = item.status === 'FAILED'
  const isDuplicate = item.reason.toLowerCase().includes('duplicate')

  const badgeClass =
    isDuplicate ? 'badge-completed' :
    isNoFace ? 'badge-processing' :
    isFailed ? 'badge-failed' :
    'badge-pending' // Outliers / pending

  const displayName = item.filename.replace(/\\/g, '/').split('/').pop()
  
  const suggestions = getReviewSuggestions(item.status, item.reason)

  const getFriendlyReason = () => {
    if (isFailed) return 'The file could not be read or is corrupted.'
    if (isNoFace) return 'AI models could not locate any clear faces.'
    if (isDuplicate) return 'Identical photo already processed.'
    return 'Face did not match any profile closely enough.'
  }

  return (
    <div
      className="review-card glass-card"
      onClick={() => onImageClick && onImageClick({
        filename: item.filename,
        imageUrl: getImageUrl(item.filename),
        confidence: null,
        clusterName: 'Needs Review / Excluded',
        status: item.status,
        reason: item.reason
      })}
      style={{ cursor: 'pointer' }}
    >
      <div className="review-card-thumb">
        <img
          src={getImageUrl(item.filename)}
          alt={displayName}
          loading="lazy"
          onError={(e) => { e.target.src = FALLBACK }}
        />
        <div className="review-card-overlay">
          <span className="review-card-status-label">
            {isDuplicate ? 'Duplicate' : isNoFace ? 'No Face' : isFailed ? 'Read Fail' : 'Outlier'}
          </span>
        </div>
      </div>
      
      <div className="review-card-body">
        <h4 className="review-card-name" title={item.filename}>
          {displayName}
        </h4>
        
        <div className="review-card-meta">
          <span className={`badge ${badgeClass} review-badge`}>
            <span className="badge-dot" />
            {isDuplicate ? 'Duplicate' : isNoFace ? 'Needs Review' : isFailed ? 'Read Fail' : 'Unclustered'}
          </span>
          <p className="review-card-reason">{getFriendlyReason()}</p>
        </div>

        {suggestions.length > 0 && (
          <div className="review-suggestions-container">
            <h5 className="review-suggestions-title">Potential Causes:</h5>
            <ul className="review-suggestions-list">
              {suggestions.map((s, idx) => (
                <li key={idx} className="review-suggestions-item">
                  <span className="review-suggestions-bullet">▸</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Results() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [clusters, setClusters] = useState([])
  const [noise,    setNoise]    = useState([])
  const [job,      setJob]      = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [activeTab, setActiveTab] = useState('clusters')
  const [selectedImage, setSelectedImage] = useState(null)

  // Re-cluster parameters state
  const [showReclusterModal, setShowReclusterModal] = useState(false)
  const [reclusterEps, setReclusterEps] = useState(0.40)
  const [reclusterMinSamples, setReclusterMinSamples] = useState(2)

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false)
  const [draftClusters, setDraftClusters] = useState([])
  const [draftNoise, setDraftNoise] = useState([])
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false)

  const hasEdits = localStorage.getItem(`faceClusterEdits_${jobId}`) !== null

  // Calculate average confidence dynamically
  const averageConfidence = (() => {
    let sum = 0
    let count = 0
    clusters.forEach((c) => {
      if (c.images) {
        c.images.forEach((img) => {
          sum += img.confidence || 0
          count++
        })
      }
    })
    return count > 0 ? `${(sum / count).toFixed(1)}%` : '—'
  })()

  // Calculate total images requiring review (confidence < 60%)
  const reviewCount = (() => {
    let count = 0
    clusters.forEach((c) => {
      if (c.images) {
        c.images.forEach((img) => {
          if (img.confidence && img.confidence < 60) {
            count++
          }
        })
      }
    })
    return count
  })()

  // Generate friendly processing summary text
  const getSummaryText = () => {
    const total = job?.total_images || 0
    const clusteredCount = clusters.reduce((sum, c) => sum + c.image_count, 0)
    const outlierCount = noise.length
    const clusterCount = clusters.length

    return `Our AI models analyzed ${total} images, identifying ${clusterCount} distinct individuals. Out of these, ${clusteredCount} photos were successfully clustered into match profiles, while ${outlierCount} photos were identified as unclustered outliers, duplicates, or failed detections.`
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [jobData, clusterData, noiseData] = await Promise.all([
          getJob(jobId),
          getClusters(jobId),
          getNoise(jobId),
        ])
        if (!cancelled) {
          setJob(jobData)
          setReclusterEps(jobData.eps || 0.40)
          setReclusterMinSamples(jobData.min_samples || 2)
          const savedEdits = localStorage.getItem(`faceClusterEdits_${jobId}`)
          if (savedEdits) {
            try {
              const { clusters: savedC, noise: savedN } = JSON.parse(savedEdits)
              setClusters(savedC)
              setNoise(savedN)
            } catch (e) {
              setClusters(clusterData)
              setNoise(noiseData)
            }
          } else {
            setClusters(clusterData)
            setNoise(noiseData)
          }
        }
      } catch (err) {
        if (!cancelled) {
          const friendly = getFriendlyErrorMessage(err)
          setError(friendly.message)
          showToast(friendly.message, 'error', friendly.suggestion)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [jobId])

  // --- Edit Mode Event Handlers ---
  const startEditing = () => {
    // Clone clusters & noise to draft states
    setDraftClusters(JSON.parse(JSON.stringify(clusters)))
    setDraftNoise(JSON.parse(JSON.stringify(noise)))
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
  }

  const saveEditing = () => {
    setClusters(draftClusters)
    setNoise(draftNoise)
    localStorage.setItem(
      `faceClusterEdits_${jobId}`,
      JSON.stringify({ clusters: draftClusters, noise: draftNoise })
    )
    setIsEditing(false)
    showToast("Clustering layout edits saved successfully.", "success")
  }

  const executeResetToOriginal = async () => {
    localStorage.removeItem(`faceClusterEdits_${jobId}`)
    setLoading(true)
    try {
      const [clusterData, noiseData] = await Promise.all([
        getClusters(jobId),
        getNoise(jobId)
      ])
      setClusters(clusterData)
      setNoise(noiseData)
      showToast("Restored original AI clusters.", "success")
    } catch (err) {
      const friendly = getFriendlyErrorMessage(err)
      setError(friendly.message)
      showToast(friendly.message, "error", friendly.suggestion)
    } finally {
      setLoading(false)
    }
  }

  const handleRenameCluster = (id, newName) => {
    setDraftClusters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, cluster_name: newName } : c))
    )
  }

  const handleCreateCluster = () => {
    const nextNum = draftClusters.length
    const newId = `new_cluster_${Date.now()}`
    setDraftClusters((prev) => [
      ...prev,
      {
        id: newId,
        cluster_number: nextNum,
        cluster_name: `Person ${nextNum + 1}`,
        images: []
      }
    ])
  }

  const handleRemoveImage = (filename) => {
    let foundImage = null
    const updated = draftClusters.map((c) => {
      const exists = c.images.find((img) => img.filename === filename)
      if (exists) {
        foundImage = exists
        return {
          ...c,
          images: c.images.filter((img) => img.filename !== filename)
        }
      }
      return c
    })
    
    if (foundImage) {
      setDraftClusters(updated.filter((c) => c.images.length > 0 || c.id.startsWith('new_cluster')))
      setDraftNoise((prev) => [
        ...prev,
        {
          id: `noise_${Date.now()}`,
          filename: foundImage.filename,
          status: 'NO_FACE',
          reason: 'Manually excluded by user during edit.'
        }
      ])
    }
  }

  const handleMoveImage = (filename, destClusterId) => {
    let foundImage = null
    
    // 1. Remove from source
    let cleanNoise = draftNoise
    const isFromNoise = draftNoise.find((n) => n.filename === filename)
    if (isFromNoise) {
      foundImage = {
        filename: isFromNoise.filename,
        confidence: 100.0,
        distance_to_centroid: 0.0
      }
      cleanNoise = draftNoise.filter((n) => n.filename !== filename)
    }

    let cleanClusters = draftClusters.map((c) => {
      const exists = c.images.find((img) => img.filename === filename)
      if (exists) {
        foundImage = exists
        return {
          ...c,
          images: c.images.filter((img) => img.filename !== filename)
        }
      }
      return c
    })

    if (!foundImage) return

    // 2. Create new if requested
    let targetId = destClusterId
    if (destClusterId === 'NEW') {
      const nextNum = cleanClusters.length
      targetId = `new_cluster_${Date.now()}`
      cleanClusters.push({
        id: targetId,
        cluster_number: nextNum,
        cluster_name: `Person ${nextNum + 1}`,
        images: []
      })
    }

    // 3. Add to destination
    const finalClusters = cleanClusters.map((c) => {
      if (c.id === targetId) {
        return {
          ...c,
          images: [...c.images, foundImage]
        }
      }
      return c
    })

    setDraftClusters(finalClusters)
    setDraftNoise(cleanNoise)
  }

  const handleDownloadCustom = async () => {
    const mapping = {}
    clusters.forEach((c) => {
      const name = c.cluster_name || `Person ${c.cluster_number + 1}`
      mapping[name] = c.images.map((img) => img.filename)
    })
    const noiseFilenames = noise.map((item) => item.filename)
    
    try {
      await downloadJobResults(jobId, { mapping, noise: noiseFilenames })
    } catch (err) {
      const friendly = getFriendlyErrorMessage(err)
      showToast(friendly.message, 'error', friendly.suggestion)
    }
  }

  const handleDownloadClick = () => {
    if (hasEdits) {
      handleDownloadCustom()
    } else {
      downloadJobResults(jobId)
    }
  }

  const handleReclusterSubmit = async () => {
    try {
      const result = await reclusterJob(jobId, {
        eps: reclusterEps,
        minSamples: reclusterMinSamples
      })
      setShowReclusterModal(false)
      navigate(`/jobs/${result.job_id}/processing`)
    } catch (err) {
      const friendly = getFriendlyErrorMessage(err)
      showToast(friendly.message, 'error', friendly.suggestion)
    }
  }


  if (loading) {
    return (
      <div className="page results-page">
        <div className="container">
          
          {/* Stepper Skeleton */}
          <div className="results-stepper">
            <ProgressStepper currentStep="results" />
          </div>

          {/* Header Skeleton */}
          <header className="results-header" style={{ marginBottom: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="skeleton-line" style={{ width: '240px', height: '32px', marginBottom: '8px' }} />
              <div className="skeleton-line" style={{ width: '460px', height: '16px' }} />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <div className="skeleton-line" style={{ width: '150px', height: '38px', borderRadius: 'var(--radius-md)' }} />
              <div className="skeleton-line" style={{ width: '120px', height: '38px', borderRadius: 'var(--radius-md)' }} />
            </div>
          </header>

          {/* AI Insights Dashboard Skeleton */}
          <div className="glass-card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-2xl)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="skeleton-line" style={{ width: '200px', height: '22px', marginBottom: 'var(--space-lg)' }} />
            <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton-stat-card" style={{ background: 'rgba(255,255,255,0.02)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)' }}>
                  <div className="skeleton-line" style={{ width: '50px', height: '32px', marginBottom: '8px', margin: '0 auto' }} />
                  <div className="skeleton-line" style={{ width: '90px', height: '14px', margin: '0 auto' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Tabs Skeleton */}
          <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
            <div className="skeleton-line" style={{ width: '120px', height: '38px', borderRadius: 'var(--radius-md)' }} />
            <div className="skeleton-line" style={{ width: '140px', height: '38px', borderRadius: 'var(--radius-md)' }} />
          </div>

          {/* Grid Cards Skeleton */}
          <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card" style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                  <div className="skeleton-line" style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton-line" style={{ width: '70%', height: '18px', marginBottom: '8px' }} />
                    <div className="skeleton-line" style={{ width: '40%', height: '14px' }} />
                  </div>
                </div>
                <div className="divider" style={{ opacity: 0.3 }} />
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="skeleton-line" style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-md)' }} />
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page results-page">
        <div className="container results-error-state">
          <span className="results-error-icon" aria-hidden="true">⚠</span>
          <p>{error}</p>
          <div className="results-error-actions">
            <Link to="/history" className="btn btn-secondary">← History</Link>
            <Link to="/upload"  className="btn btn-primary">New Upload</Link>
          </div>
        </div>
      </div>
    )
  }

  const activeClusters = isEditing ? draftClusters : clusters
  const activeNoise = isEditing ? draftNoise : noise
  const allDestinations = draftClusters.map((c) => ({
    id: c.id,
    name: c.cluster_name || `Person ${c.cluster_number + 1}`
  }))

  return (
    <div className="page results-page">
      <div className="container">

        {/* Stepper */}
        <div className="results-stepper animate-fade-in-up">
          <ProgressStepper currentStep="results" />
        </div>

        {/* Header */}
        <header className="results-header animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <div>
            <h1 className="results-title">
              Clustering <span className="text-gradient">Results</span>
            </h1>
          </div>
          <div className="results-actions">
            {isEditing ? (
              <div className="edit-mode-indicator">
                <span className="edit-mode-indicator-dot" />
                Edit Mode
              </div>
            ) : (
              <>
                <Link to={`/jobs/${jobId}/download`} className="btn btn-secondary" id="download-zip-btn">
                  📥 Export & Download
                </Link>
                <button className="btn btn-secondary" onClick={() => setShowReclusterModal(true)} id="recluster-btn">
                  🔄 Re-cluster
                </button>
                <button className="btn btn-secondary" onClick={startEditing} id="edit-layout-btn">
                  ✏️ Edit Layout
                </button>
                <Link to="/upload"  className="btn btn-primary" id="new-job-btn">
                  + New Job
                </Link>
                <Link to="/history" className="btn btn-secondary">
                  History
                </Link>
              </>
            )}
          </div>
        </header>

        {/* Edit Actions Bar */}
        {isEditing && (
          <div className="results-edit-actions-bar animate-fade-in-up">
            <button className="btn btn-secondary" onClick={handleCreateCluster}>
              + Create Profile
            </button>
            <button className="btn btn-primary" onClick={saveEditing}>
              Save Changes
            </button>
            <button className="btn btn-secondary" onClick={cancelEditing}>
              Cancel
            </button>
          </div>
        )}

        {/* Custom Layout Preview Banner */}
        {hasEdits && !isEditing && (
          <div className="results-edit-banner animate-fade-in-up">
            <span>📂 Previewing customized layout edits. Clicking 'Download ZIP' will export this version.</span>
            <div className="results-edit-banner-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowResetConfirmModal(true)}>
                Reset to Original
              </button>
            </div>
          </div>
        )}

        {/* Summary Bar */}
        {job && (
          <div className="results-summary glass-card animate-fade-in-up" style={{ animationDelay: '160ms' }}>
            <div className="results-summary-stat">
              <span className="results-summary-val">{job.total_images}</span>
              <span className="results-summary-lbl">Total Images</span>
            </div>
            <div className="results-summary-divider" />
            <div className="results-summary-stat">
              <span className="results-summary-val">{clusters.length}</span>
              <span className="results-summary-lbl">Total Clusters</span>
            </div>
            <div className="results-summary-divider" />
            <div className="results-summary-stat">
              <span className="results-summary-val">{noise.length}</span>
              <span className="results-summary-lbl">Noise Images</span>
            </div>
            <div className="results-summary-divider" />
            <div className="results-summary-stat">
              <span className="results-summary-val">{averageConfidence}</span>
              <span className="results-summary-lbl">Average Confidence</span>
            </div>
          </div>
        )}

        {/* Cluster Distribution Bar Chart */}
        {job && job.total_images > 0 && clusters.length > 0 && activeTab === 'clusters' && (
          <div className="results-distribution glass-card animate-fade-in-up" style={{ animationDelay: '180ms' }}>
            <h3 className="results-distribution-title">Cluster Size Distribution</h3>
            <div className="results-distribution-bar">
              {clusters.map((c, i) => {
                const pct = (c.image_count / job.total_images) * 100
                const colors = ['#6366f1', '#8b5cf6', '#38bdf8', '#f59e0b', '#22c55e', '#ec4899', '#14b8a6']
                const color = colors[i % colors.length]
                return (
                  <div
                    key={c.id}
                    className="results-distribution-segment"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                    title={`Person ${c.cluster_number + 1}: ${c.image_count} photos (${pct.toFixed(1)}%)`}
                  />
                )
              })}
              {/* Excluded Noise segment */}
              {noise.length > 0 && (
                <div
                  className="results-distribution-segment results-distribution-segment--noise"
                  style={{ width: `${(noise.length / job.total_images) * 100}%` }}
                  title={`Noise/Excluded: ${noise.length} photos (${((noise.length / job.total_images) * 100).toFixed(1)}%)`}
                />
              )}
            </div>
            <div className="results-distribution-legend">
              {clusters.slice(0, 5).map((c, i) => {
                const colors = ['#6366f1', '#8b5cf6', '#38bdf8', '#f59e0b', '#22c55e', '#ec4899', '#14b8a6']
                const color = colors[i % colors.length]
                return (
                  <div key={c.id} className="results-legend-item">
                    <span className="results-legend-dot" style={{ backgroundColor: color }} />
                    <span>Person {c.cluster_number + 1} ({c.image_count})</span>
                  </div>
                )
              })}
              {clusters.length > 5 && (
                <div className="results-legend-item">
                  <span className="results-legend-dot" style={{ backgroundColor: '#4b5a73' }} />
                  <span>Other Clusters ({clusters.slice(5).reduce((sum, c) => sum + c.image_count, 0)})</span>
                </div>
              )}
              {noise.length > 0 && (
                <div className="results-legend-item">
                  <span className="results-legend-dot results-legend-dot--noise" />
                  <span>Noise ({noise.length})</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Insights & Recommendations */}
        {job && job.total_images > 0 && (
          <section className="results-ai-insights glass-card animate-fade-in-up" style={{ animationDelay: '190ms' }} aria-labelledby="insights-heading">
            <h2 id="insights-heading" className="results-insights-title">
              ✨ AI Insights & Recommendations
            </h2>
            
            <p className="insights-summary-text">
              {getSummaryText()}
            </p>

            <div className="insights-grid">
              <div className="insight-metric-box">
                <span className="insight-metric-value">
                  {clusters.reduce((sum, c) => sum + c.image_count, 0)}
                </span>
                <span className="insight-metric-label">Clustered Images</span>
              </div>
              <div className="insight-metric-box">
                <span className="insight-metric-value">{noise.length}</span>
                <span className="insight-metric-label">Unclustered Images</span>
              </div>
              <div className="insight-metric-box">
                <span className="insight-metric-value">{averageConfidence}</span>
                <span className="insight-metric-label">Avg Confidence</span>
              </div>
              <div className="insight-metric-box">
                <span className="insight-metric-value" style={{ color: reviewCount > 0 ? '#fbbf24' : 'inherit' }}>
                  {reviewCount}
                </span>
                <span className="insight-metric-label">Requires Review</span>
              </div>
            </div>

            <div className="insight-recommendations">
              {reviewCount > 0 && (
                <div className="insight-alert-item insight-alert-item--warning">
                  <span className="insight-alert-icon">⚠️</span>
                  <div>
                    <strong>Action Required:</strong> We found {reviewCount} image(s) with low confidence (&lt;60%). These images may have side profiles, motion blur, or bad lighting. We recommend reviewing these cards (marked with ⚠️ badges) to verify matches.
                  </div>
                </div>
              )}

              {noise.length > 0 && (
                <div className="insight-alert-item insight-alert-item--tip">
                  <span className="insight-alert-icon">💡</span>
                  <div>
                    <strong>Optimization Tip:</strong> {noise.length} image(s) were classified as noise/outliers. This happens when faces are shot from extreme angles, or if the dataset has only one photo of that person. Try uploading more photos of these individuals to improve grouping accuracy.
                  </div>
                </div>
              )}

              {parseFloat(averageConfidence) >= 75 && (
                <div className="insight-alert-item insight-alert-item--success">
                  <span className="insight-alert-icon">⭐</span>
                  <div>
                    <strong>Optimal Performance:</strong> Great dataset quality! The average clustering confidence score of {averageConfidence} indicates high-quality, clear input photos with direct camera alignment.
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Tabs switcher */}
        {job && job.total_images > 0 && (
          <div className="results-tabs animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <button
              id="tab-clusters"
              className={`results-tab ${activeTab === 'clusters' ? 'results-tab--active' : ''}`}
              onClick={() => setActiveTab('clusters')}
            >
              👥 Clusters ({activeClusters.length})
            </button>
            <button
              id="tab-noise"
              className={`results-tab ${activeTab === 'noise' ? 'results-tab--active' : ''}`}
              onClick={() => setActiveTab('noise')}
            >
              ⚠️ Needs Review ({activeNoise.length})
            </button>
          </div>
        )}

        {/* Duplicate job warning */}
        {job && job.total_images === 0 && (
          <div className="results-duplicate-banner animate-fade-in-up" style={{ animationDelay: '240ms' }} role="alert" id="duplicate-job-notice">
            <div className="results-duplicate-icon" aria-hidden="true">⟳</div>
            <div className="results-duplicate-body">
              <p className="results-duplicate-title">All images were already processed</p>
              <p className="results-duplicate-desc">
                Every image in this upload was recognised as a duplicate of a previously
                processed image. No new clustering was performed for this job.
                Try uploading different images to get results.
              </p>
              <Link to="/upload" className="btn btn-primary btn-sm" id="upload-new-btn">Upload New Images</Link>
            </div>
          </div>
        )}

        {/* Tab content */}
        {job && job.total_images > 0 && (
          <div className="results-tab-content">
            {activeTab === 'clusters' ? (
              <section
                className="results-grid-section animate-fade-in-up"
                style={{ animationDelay: '240ms' }}
                aria-label="Face clusters"
              >
                {activeClusters.length === 0 ? (
                  <div className="empty-state glass-card">
                    <span className="empty-state-icon" aria-hidden="true" style={{ fontSize: '3.5rem', opacity: 0.5 }}>👥</span>
                    <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 'var(--space-xs) 0' }}>No Profiles Clustered</h3>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto var(--space-md) auto' }}>
                      No face clusters were established. This could mean Epsilon radius (eps) is set too low or you don't have enough matching faces. Try running Re-cluster with customized options.
                    </p>
                    <button className="btn btn-primary" onClick={() => setShowReclusterModal(true)}>
                      Adjust Parameters
                    </button>
                  </div>
                ) : (
                  <ClusterGrid
                    clusters={activeClusters}
                    onImageClick={setSelectedImage}
                    isEditing={isEditing}
                    allClusters={allDestinations}
                    onRename={handleRenameCluster}
                    onMoveImage={handleMoveImage}
                    onRemoveImage={handleRemoveImage}
                  />
                )}
              </section>
            ) : (
              <section
                className="results-noise-section animate-fade-in-up"
                style={{ animationDelay: '240ms' }}
                aria-label="Excluded review images"
              >
                {activeNoise.length === 0 ? (
                  <div className="empty-state glass-card" style={{ padding: 'var(--space-2xl) var(--space-xl)', border: '1px dashed rgba(34, 197, 94, 0.2)' }}>
                    <span className="empty-state-icon" aria-hidden="true" style={{ fontSize: '3.5rem', color: '#10b981', opacity: 0.8 }}>✨</span>
                    <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 'var(--space-xs) 0', color: '#fff' }}>All Clean!</h3>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
                      Excellent! All faces in this upload were clustered successfully with high confidence. No images require manual review or adjustments.
                    </p>
                  </div>
                ) : (
                  <div className="review-grid">
                    {activeNoise.map((item) => (
                      <ReviewCard
                        key={item.id}
                        item={item}
                        onImageClick={setSelectedImage}
                        isEditing={isEditing}
                        allClusters={allDestinations}
                        onMove={handleMoveImage}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}

      </div>

      {/* Image Preview Modal */}
      {selectedImage && (() => {
        const getHumanReadableReason = (img) => {
          if (img.status === 'FAILED') {
            return "This image file could not be read or processed by our AI models. It might be corrupted, in an unsupported format, or truncated."
          }
          if (img.status === 'NO_FACE') {
            return "No face was detected in this image. Ensure the photo contains a clear, well-lit face looking towards the camera with minimal obstruction (e.g. no heavy sunglasses or masks)."
          }
          if (img.reason && img.reason.toLowerCase().includes('duplicate')) {
            return "This image is identical to a photo that was already processed in a previous job. The system automatically skipped it to prevent redundant computations."
          }
          if (img.status === 'PENDING') {
            return "This image is currently in the queue or outlier group because it did not match any other face in the collection closely enough."
          }
          return null
        }

        const getImageQuality = (img) => {
          if (img.status === 'FAILED') return 'Corrupted File'
          if (img.status === 'NO_FACE') return 'No Detectable Face'
          if (img.confidence == null) return 'Outlier / Unclustered'
          if (img.confidence >= 80) return 'High Quality (Optimal resolution and lighting)'
          if (img.confidence >= 60) return 'Standard Quality (Clear visibility)'
          return 'Low Visibility (Potential motion blur, poor lighting, or sharp angle)'
        }

        return (
          <div className="preview-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setSelectedImage(null)}>
            <div className="preview-modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="preview-modal-close-btn" onClick={() => setSelectedImage(null)} aria-label="Close preview">
                ✕
              </button>
              
              <div className="preview-modal-image-pane">
                <img src={selectedImage.imageUrl} alt={selectedImage.filename.split('/').pop()} onError={(e) => { e.target.src = FALLBACK }} />
              </div>
              
              <div className="preview-modal-details-pane">
                <div className="preview-details-header">
                  <h3 className="preview-details-title">{selectedImage.filename.split('/').pop()}</h3>
                  <p className="preview-details-subtitle">ID: {selectedImage.filename}</p>
                </div>
                
                <div className="preview-details-grid">
                  <div className="preview-detail-row">
                    <span className="preview-detail-label">Cluster Location</span>
                    <span className="preview-detail-value">{selectedImage.clusterName}</span>
                  </div>
                  
                  <div className="preview-detail-row">
                    <span className="preview-detail-label">Status</span>
                    <span className="preview-detail-value">{selectedImage.status}</span>
                  </div>

                  <div className="preview-detail-row">
                    <span className="preview-detail-label">Confidence Score</span>
                    <span className="preview-detail-value">
                      {selectedImage.confidence != null ? `${selectedImage.confidence.toFixed(1)}%` : '—'}
                    </span>
                  </div>

                  <div className="preview-detail-row">
                    <span className="preview-detail-label">Image Analysis Quality</span>
                    <span className="preview-detail-value">{getImageQuality(selectedImage)}</span>
                  </div>

                  {selectedImage.distanceToCentroid != null && (
                    <div className="preview-detail-row">
                      <span className="preview-detail-label">Cosine Distance to Centroid</span>
                      <span className="preview-detail-value">Δ {selectedImage.distanceToCentroid.toFixed(4)}</span>
                    </div>
                  )}

                  {/* Friendly Issues Diagnostics Banner */}
                  {(selectedImage.status !== 'COMPLETED' || selectedImage.clusterName.includes('Review') || selectedImage.clusterName.includes('Noise')) && (
                    <div className="preview-issues-banner">
                      <div className="preview-issues-title">💡 Image Notice</div>
                      <div>{getHumanReadableReason(selectedImage) || "This image was classified as an outlier because it did not match any of the primary identity clusters."}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Re-cluster Parameter Modal */}
      {showReclusterModal && (
        <div className="recluster-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setShowReclusterModal(false)}>
          <div className="recluster-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="recluster-modal-title">🔄 Adjust Re-clustering Options</h3>
            <p className="recluster-form-help">
              Re-clustering will spawn a new separate version of the dataset. It skips face detection and embedding calculations, finishing almost instantly.
            </p>

            <div className="recluster-form">
              <div className="recluster-form-group">
                <span className="recluster-form-label">Match Strictness (Epsilon Radius): {reclusterEps.toFixed(2)}</span>
                <div className="recluster-form-input-row">
                  <input
                    type="range"
                    min="0.10"
                    max="0.90"
                    step="0.05"
                    value={reclusterEps}
                    onChange={(e) => setReclusterEps(parseFloat(e.target.value))}
                    className="recluster-form-slider"
                  />
                  <input
                    type="number"
                    min="0.10"
                    max="0.90"
                    step="0.01"
                    value={reclusterEps}
                    onChange={(e) => setReclusterEps(Math.max(0.01, Math.min(1.0, parseFloat(e.target.value) || 0.40)))}
                    className="recluster-form-number"
                  />
                </div>
                <p className="recluster-form-help">
                  Lower values make matching stricter (perfect match checks, but increases unclustered outliers). Higher values merge lookalike individuals together.
                </p>
              </div>

              <div className="recluster-form-group">
                <span className="recluster-form-label">Minimum Group Size (Min Samples): {reclusterMinSamples}</span>
                <div className="recluster-form-input-row">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={reclusterMinSamples}
                    onChange={(e) => setReclusterMinSamples(parseInt(e.target.value, 10))}
                    className="recluster-form-slider"
                  />
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={reclusterMinSamples}
                    onChange={(e) => setReclusterMinSamples(Math.max(1, parseInt(e.target.value, 10) || 2))}
                    className="recluster-form-number"
                  />
                </div>
                <p className="recluster-form-help">
                  The minimum number of face matches required to automatically establish a profile group.
                </p>
              </div>
            </div>

            <div className="recluster-modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowReclusterModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleReclusterSubmit}>
                Confirm Re-cluster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog Modal */}
      {showResetConfirmModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="reset-modal-title" onClick={() => setShowResetConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ color: '#fbbf24' }}>
              <span className="modal-warning-icon" aria-hidden="true">⚠️</span>
              <h3 id="reset-modal-title" className="modal-title">Reset Layout Edits</h3>
            </div>
            
            <div className="modal-body">
              <p>Are you sure you want to reset all customized layout edits?</p>
              <p style={{ color: '#fbbf24', fontWeight: 600, marginTop: '8px' }}>
                This will permanently delete all manual profile renaming, custom groups moving, and exclusions you've saved. Your original AI clusters will be restored.
              </p>
            </div>
            
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowResetConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                style={{ background: '#ef4444', borderColor: '#ef4444', color: '#fff' }}
                onClick={() => {
                  setShowResetConfirmModal(false)
                  executeResetToOriginal()
                }}
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
