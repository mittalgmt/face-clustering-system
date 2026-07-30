import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import ProgressStepper from '../components/ProgressStepper'
import { getJob, downloadJobResults } from '../api/jobsApi'
import { getClusters, getNoise } from '../api/clustersApi'
import { useToast } from '../context/ToastContext'
import { getFriendlyErrorMessage } from '../utils/errors'
import './Download.css'

export default function Download() {
  const { jobId } = useParams()
  const { showToast } = useToast()
  const [job, setJob] = useState(null)
  const [clusters, setClusters] = useState([])
  const [noise, setNoise] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)

  // Check if customized layout edits exist in localStorage
  const savedEdits = localStorage.getItem(`faceClusterEdits_${jobId}`)
  const isCustomized = savedEdits !== null

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
          // If custom edits exist in storage, load those counts instead
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
  }, [jobId, savedEdits])

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

  const handleDownload = async () => {
    setDownloading(true)
    try {
      if (isCustomized) {
        const { clusters: savedC, noise: savedN } = JSON.parse(savedEdits)
        const mapping = {}
        savedC.forEach((c) => {
          const name = c.cluster_name || `Person ${c.cluster_number + 1}`
          mapping[name] = c.images.map((img) => img.filename)
        })
        const noiseFilenames = savedN.map((item) => item.filename)
        await downloadJobResults(jobId, { mapping, noise: noiseFilenames })
      } else {
        await downloadJobResults(jobId)
      }
      showToast("Compiled ZIP downloaded successfully.", "success")
    } catch (err) {
      const friendly = getFriendlyErrorMessage(err)
      showToast(friendly.message, "error", friendly.suggestion)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="page download-page">
        <div className="container download-loading">
          <span className="spinner spinner-lg" aria-label="Loading results summary" />
          <p>Compiling results summary…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page download-page">
        <div className="container download-error-state">
          <span className="download-error-icon" aria-hidden="true">⚠</span>
          <p>{error}</p>
          <div className="download-error-actions">
            <Link to={`/results/${jobId}`} className="btn btn-secondary">← Back to Results</Link>
            <Link to="/history" className="btn btn-primary">History</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page download-page">
      <div className="container">
        
        {/* Stepper */}
        <div className="download-stepper animate-fade-in-up">
          <ProgressStepper currentStep="download" />
        </div>

        {/* Header */}
        <header className="download-header animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <h1 className="download-title">
            Export <span className="text-gradient">Results</span>
          </h1>
          <p className="download-subtitle">
            Preview your dataset statistics and download the compiled ZIP file.
          </p>
        </header>

        {/* Summary Card */}
        {job && (
          <div className="download-summary-card glass-card animate-fade-in-up" style={{ animationDelay: '160ms' }}>
            <div className="download-summary-badge-row">
              <span className={`badge ${isCustomized ? 'badge-completed' : 'badge-pending'}`}>
                {isCustomized ? '📂 Customized Layout (Edited)' : '🤖 Original AI Clusters'}
              </span>
            </div>

            <div className="download-stats-grid">
              <div className="download-stat-box">
                <span className="download-stat-val">{job.total_images}</span>
                <span className="download-stat-lbl">Total Images</span>
              </div>
              
              <div className="download-stat-box">
                <span className="download-stat-val">{clusters.length}</span>
                <span className="download-stat-lbl">Total Clusters</span>
              </div>

              <div className="download-stat-box">
                <span className="download-stat-val">{noise.length}</span>
                <span className="download-stat-lbl">Needs Review</span>
              </div>

              <div className="download-stat-box">
                <span className="download-stat-val">{averageConfidence}</span>
                <span className="download-stat-lbl">Avg Confidence</span>
              </div>
            </div>

            {/* Recommendations Banner */}
            <div className="download-banner-tip">
              <strong>📁 ZIP File Structure:</strong> The download packages faces inside distinct subdirectories matching the profile names (e.g. <code>John Doe/</code> or <code>Person 1/</code>). Faces that were excluded or could not be matched will be grouped inside the <code>Noise/</code> subdirectory.
            </div>
          </div>
        )}

        {/* Action Panel */}
        <div className="download-action-panel animate-fade-in-up" style={{ animationDelay: '240ms' }}>
          <button 
            className="btn btn-primary btn-lg btn-download-zip" 
            onClick={handleDownload} 
            disabled={downloading}
          >
            {downloading ? (
              <>
                <span className="spinner spinner-sm" style={{ marginRight: '8px' }} />
                Compiling ZIP...
              </>
            ) : (
              '📥 Download ZIP Package'
            )}
          </button>

          <div className="download-nav-links">
            <Link to={`/results/${jobId}`} className="btn btn-secondary">
              ← Back to Results
            </Link>
            <Link to="/upload" className="btn btn-secondary">
              New Upload
            </Link>
            <Link to="/history" className="btn btn-secondary">
              History
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
