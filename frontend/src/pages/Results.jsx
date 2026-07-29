import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import ClusterGrid from '../components/ClusterGrid'
import ProgressStepper from '../components/ProgressStepper'
import { getClusters, getNoise, getImageUrl } from '../api/clustersApi'
import { getJob } from '../api/jobsApi'
import './Results.css'

const FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect fill='%230d1424' width='80' height='80'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='28' fill='%234b5a73'%3E👤%3C/text%3E%3C/svg%3E"

function NoiseCard({ item }) {
  const isNoFace = item.status === 'NO_FACE'
  const isFailed = item.status === 'FAILED'
  const isDuplicate = item.reason.toLowerCase().includes('duplicate')

  const badgeClass =
    isDuplicate ? 'badge-completed' :
    isNoFace ? 'badge-processing' :
    isFailed ? 'badge-failed' :
    'badge-pending' // Outliers / pending

  const displayName = item.filename.split('/').pop()

  return (
    <div className="noise-card glass-card">
      <div className="noise-card-thumb">
        <img
          src={getImageUrl(item.filename)}
          alt={displayName}
          loading="lazy"
          onError={(e) => { e.target.src = FALLBACK }}
        />
        <div className="noise-card-overlay">
          <span className="noise-card-status-label">{item.status}</span>
        </div>
      </div>
      <div className="noise-card-body">
        <h4 className="noise-card-name" title={item.filename}>
          {displayName}
        </h4>
        <div className="noise-card-meta">
          <span className={`badge ${badgeClass} noise-badge`}>
            <span className="badge-dot" />
            {isDuplicate ? 'Duplicate' : isNoFace ? 'No Face' : isFailed ? 'Failed' : 'Outlier'}
          </span>
          <p className="noise-card-reason">{item.reason}</p>
        </div>
      </div>
    </div>
  )
}

export default function Results() {
  const { jobId } = useParams()
  const [clusters, setClusters] = useState([])
  const [noise,    setNoise]    = useState([])
  const [job,      setJob]      = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [activeTab, setActiveTab] = useState('clusters')

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
          setClusters(clusterData)
          setNoise(noiseData)
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [jobId])

  if (loading) {
    return (
      <div className="page results-page">
        <div className="container results-loading">
          <span className="spinner spinner-lg" aria-label="Loading results" />
          <p>Loading cluster results…</p>
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
            <Link to="/upload"  className="btn btn-primary" id="new-job-btn">
              + New Job
            </Link>
            <Link to="/history" className="btn btn-secondary">
              History
            </Link>
          </div>
        </header>

        {/* Summary Bar */}
        {job && (
          <div className="results-summary glass-card animate-fade-in-up" style={{ animationDelay: '160ms' }}>
            <div className="results-summary-stat">
              <span className="results-summary-val">{job.total_images}</span>
              <span className="results-summary-lbl">Images Processed</span>
            </div>
            <div className="results-summary-divider" />
            <div className="results-summary-stat">
              <span className="results-summary-val">{clusters.length}</span>
              <span className="results-summary-lbl">Face Clusters</span>
            </div>
            <div className="results-summary-divider" />
            <div className="results-summary-stat">
              <span className="results-summary-val">
                {job.completed_at
                  ? new Date(job.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '—'}
              </span>
              <span className="results-summary-lbl">Completed At</span>
            </div>
            <div className="results-summary-divider" />
            <div className="results-summary-stat">
              <span className={`badge badge-${job.status?.toLowerCase()}`}>
                <span className="badge-dot" />
                {job.status}
              </span>
              <span className="results-summary-lbl">Status</span>
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

        {/* Tabs switcher */}
        {job && job.total_images > 0 && (
          <div className="results-tabs animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <button
              id="tab-clusters"
              className={`results-tab ${activeTab === 'clusters' ? 'results-tab--active' : ''}`}
              onClick={() => setActiveTab('clusters')}
            >
              👥 Clusters ({clusters.length})
            </button>
            <button
              id="tab-noise"
              className={`results-tab ${activeTab === 'noise' ? 'results-tab--active' : ''}`}
              onClick={() => setActiveTab('noise')}
            >
              ⚠ Noise & Excluded ({noise.length})
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
                {clusters.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-state-icon" aria-hidden="true">🔍</span>
                    <p>No face clusters were found.</p>
                    <Link to="/upload" className="btn btn-primary btn-sm">Upload Again</Link>
                  </div>
                ) : (
                  <ClusterGrid clusters={clusters} />
                )}
              </section>
            ) : (
              <section
                className="results-noise-section animate-fade-in-up"
                style={{ animationDelay: '240ms' }}
                aria-label="Excluded noise images"
              >
                {noise.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-state-icon" aria-hidden="true">✨</span>
                    <p>No noise or excluded images found. All images were successfully clustered!</p>
                  </div>
                ) : (
                  <div className="noise-grid">
                    {noise.map((item) => (
                      <NoiseCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
