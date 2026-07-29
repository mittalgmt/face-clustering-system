import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import ProgressStepper from '../components/ProgressStepper'
import { usePolling } from '../hooks/usePolling'
import './Processing.css'

const STATUS_MESSAGES = {
  PENDING:    'Job queued — waiting for a worker…',
  PROCESSING: 'AI is detecting faces and computing embeddings…',
  COMPLETED:  'Clustering complete! Redirecting to results…',
  FAILED:     'Processing failed. Please try uploading again.',
}

const HISTORY_KEY = 'faceClusterHistory'

function updateHistoryJob(jobId, patch) {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    const updated = history.map((j) => j.job_id === jobId ? { ...j, ...patch } : j)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  } catch { /* ignore */ }
}

export default function Processing() {
  const { jobId } = useParams()
  const navigate  = useNavigate()
  const { job, loading, error } = usePolling(jobId)

  // Redirect on completion
  useEffect(() => {
    if (job?.status === 'COMPLETED') {
      updateHistoryJob(jobId, {
        status: 'COMPLETED',
        total_clusters: job.total_clusters,
        completed_at: job.completed_at,
      })
      const timer = setTimeout(() => navigate(`/results/${jobId}`), 1200)
      return () => clearTimeout(timer)
    }
  }, [job, jobId, navigate])

  const progress    = job?.progress ?? 0
  const status      = job?.status   ?? 'PENDING'
  const isFailed    = status === 'FAILED' || !!error
  const isCompleted = status === 'COMPLETED'

  return (
    <div className="page processing-page">
      <div className="container">

        {/* Header */}
        <div className="proc-header animate-fade-in-up">
          <h1 className="proc-title">
            {isFailed ? 'Processing Failed' : isCompleted ? 'Done!' : 'Processing…'}
          </h1>
          <p className="proc-subtitle">Job ID: <code className="proc-id">{jobId}</code></p>
        </div>

        {/* Stepper */}
        <div className="proc-stepper animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <ProgressStepper currentStep="processing" error={isFailed} />
        </div>

        {/* Main Card */}
        <div className="proc-card glass-card animate-fade-in-up" style={{ animationDelay: '160ms' }}>

          {loading && !job && (
            <div className="proc-loading">
              <span className="spinner spinner-lg" aria-label="Loading" />
              <p>Connecting to server…</p>
            </div>
          )}

          {job && !isFailed && (
            <>
              {/* Progress Ring */}
              <div className="proc-ring-wrapper" aria-label={`Progress: ${progress}%`}>
                <svg className="proc-ring" viewBox="0 0 120 120" aria-hidden="true">
                  <defs>
                    <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--accent)" />
                      <stop offset="100%" stopColor="var(--accent-light)" />
                    </linearGradient>
                  </defs>
                  <circle className="proc-ring-track" cx="60" cy="60" r="52" />
                  <circle
                    className="proc-ring-fill"
                    cx="60" cy="60" r="52"
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                  />
                </svg>
                <div className="proc-ring-label">
                  <span className="proc-ring-pct">{progress}%</span>
                  <span className="proc-ring-sub">complete</span>
                </div>
              </div>



              {/* Stats Row */}
              <div className="proc-stats">
                <div className="proc-stat">
                  <span className="proc-stat-value">{job.total_images}</span>
                  <span className="proc-stat-label">Images</span>
                </div>
                <div className="proc-stat-divider" />
                <div className="proc-stat">
                  <span className="proc-stat-value">{job.total_clusters || '—'}</span>
                  <span className="proc-stat-label">Clusters</span>
                </div>
                <div className="proc-stat-divider" />
                <div className="proc-stat">
                  <span className={`badge badge-${status.toLowerCase()}`}>
                    <span className="badge-dot" />
                    {status}
                  </span>
                  <span className="proc-stat-label">Status</span>
                </div>
              </div>

              <p className="proc-message">
                {STATUS_MESSAGES[status] || 'Processing…'}
              </p>

              {isCompleted && (
                <Link to={`/results/${jobId}`} className="btn btn-primary btn-lg proc-results-btn" id="view-results-btn">
                  View Results →
                </Link>
              )}
            </>
          )}

          {isFailed && (
            <div className="proc-error">
              <span className="proc-error-icon" aria-hidden="true">✕</span>
              <p>{error || STATUS_MESSAGES.FAILED}</p>
              <Link to="/upload" className="btn btn-primary">Try Again</Link>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
