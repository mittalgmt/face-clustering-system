import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DashboardCard from '../components/DashboardCard'
import { getJobs, deleteJob, reclusterJob, downloadJobResults } from '../api/jobsApi'
import { useToast } from '../context/ToastContext'
import { getFriendlyErrorMessage } from '../utils/errors'
import './Dashboard.css'

const CUSTOM_NAMES_KEY = 'faceClusterCustomNames'

function getCustomNames() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_NAMES_KEY) || '{}')
  } catch {
    return {}
  }
}

function StatusBadge({ status }) {
  const map = {
    PENDING:    'badge-pending',
    PROCESSING: 'badge-processing',
    COMPLETED:  'badge-completed',
    FAILED:     'badge-failed',
  }
  return (
    <span className={`badge ${map[status] || 'badge-pending'}`}>
      <span className="badge-dot" aria-hidden="true" />
      {status}
    </span>
  )
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Custom Names
  const [customNames, setCustomNames] = useState(() => getCustomNames())
  const [editingJobId, setEditingJobId] = useState(null)
  const [editNameValue, setEditNameValue] = useState('')

  // Search & Sort State
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')

  // Deletion Modal State
  const [deleteConfirmJob, setDeleteConfirmJob] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Action Pending States
  const [reclusteringIds, setReclusteringIds] = useState(new Set())
  const [downloadingIds, setDownloadingIds] = useState(new Set())

  // Fetch all jobs
  const fetchJobs = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const data = await getJobs()
      setJobs(data)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch jobs:', err)
      const friendly = getFriendlyErrorMessage(err)
      setError(friendly.message)
      showToast(friendly.message, 'error', friendly.suggestion)
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  // Initial Load
  useEffect(() => {
    fetchJobs(true)
  }, [fetchJobs])

  // Polling for active jobs
  useEffect(() => {
    const hasActiveJobs = jobs.some(
      (job) => job.status === 'PROCESSING' || job.status === 'PENDING'
    )
    if (!hasActiveJobs) return

    const interval = setInterval(() => {
      fetchJobs(false)
    }, 3000)

    return () => clearInterval(interval)
  }, [jobs, fetchJobs])

  // Stats computation
  const stats = (() => {
    const total = jobs.length
    const completed = jobs.filter((j) => j.status === 'COMPLETED').length
    const totalImg = jobs.reduce((s, j) => s + (j.total_images || 0), 0)
    const totalClusters = jobs.reduce((s, j) => s + (j.total_clusters || 0), 0)
    return { total, completed, totalImg, totalClusters }
  })()

  // Handle job renaming
  const handleStartRename = (jobId, currentName) => {
    setEditingJobId(jobId)
    setEditNameValue(currentName)
  }

  const handleSaveRename = (jobId) => {
    const trimmed = editNameValue.trim()
    const updatedNames = { ...customNames }
    if (trimmed) {
      updatedNames[jobId] = trimmed
    } else {
      delete updatedNames[jobId]
    }
    setCustomNames(updatedNames)
    localStorage.setItem(CUSTOM_NAMES_KEY, JSON.stringify(updatedNames))
    setEditingJobId(null)
  }

  const handleKeyDownRename = (e, jobId) => {
    if (e.key === 'Enter') {
      handleSaveRename(jobId)
    } else if (e.key === 'Escape') {
      setEditingJobId(null)
    }
  }

  // Handle delete trigger
  const handleDeleteClick = (job) => {
    setDeleteConfirmJob(job)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmJob) return
    setDeleting(true)
    try {
      await deleteJob(deleteConfirmJob.id)
      
      // Clean local storage custom name
      const updatedNames = { ...customNames }
      delete updatedNames[deleteConfirmJob.id]
      setCustomNames(updatedNames)
      localStorage.setItem(CUSTOM_NAMES_KEY, JSON.stringify(updatedNames))

      setDeleteConfirmJob(null)
      fetchJobs(false)
      
      showToast("Job archived successfully.", "success")
    } catch (err) {
      const friendly = getFriendlyErrorMessage(err)
      showToast(friendly.message, "error", friendly.suggestion)
    } finally {
      setDeleting(false)
    }
  }

  // Handle re-clustering trigger
  const handleReclusterClick = async (jobId) => {
    setReclusteringIds((prev) => new Set([...prev, jobId]))
    try {
      await reclusterJob(jobId)
      showToast("Re-clustering job version scheduled successfully.", "success")
      fetchJobs(false)
    } catch (err) {
      const friendly = getFriendlyErrorMessage(err)
      showToast(friendly.message, "error", friendly.suggestion)
    } finally {
      setReclusteringIds((prev) => {
        const next = new Set(prev)
        next.delete(jobId)
        return next
      })
    }
  }

  // Handle download results trigger
  const handleDownloadClick = async (jobId) => {
    setDownloadingIds((prev) => new Set([...prev, jobId]))
    try {
      await downloadJobResults(jobId)
    } catch (err) {
      showToast('Failed to download results.', 'error')
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev)
        next.delete(jobId)
        return next
      })
    }
  }

  // Search & Sort implementation
  const filteredAndSortedJobs = jobs
    .filter((job) => {
      const customName = customNames[job.id] || ''
      const searchString = `${job.id} ${customName} ${job.status}`.toLowerCase()
      return searchString.includes(searchQuery.toLowerCase())
    })
    .sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.created_at) - new Date(a.created_at)
      }
      if (sortBy === 'date-asc') {
        return new Date(a.created_at) - new Date(b.created_at)
      }
      if (sortBy === 'images-desc') {
        return (b.total_images || 0) - (a.total_images || 0)
      }
      if (sortBy === 'status') {
        return a.status.localeCompare(b.status)
      }
      return 0
    })

  return (
    <div className="page dashboard">
      <div className="container">

        {/* Hero */}
        <section className="dash-hero animate-fade-in-up" aria-labelledby="dash-heading">
          <div className="dash-hero-content">
            <p className="dash-hero-eyebrow">AI-Powered</p>
            <h1 id="dash-heading" className="dash-hero-title">
              Group Faces <span className="text-gradient">Automatically</span>
            </h1>
            <p className="dash-hero-subtitle">
              Upload a photo collection and our AI clusters all faces by identity — no labels needed.
            </p>
            <div className="dash-hero-actions">
              <Link to="/upload" id="hero-upload-btn" className="btn btn-primary btn-lg">
                ↑ &nbsp;Upload Images
              </Link>
            </div>
          </div>
          <div className="dash-hero-graphic" aria-hidden="true">
            <div className="dash-hero-orb dash-hero-orb--1" />
            <div className="dash-hero-orb dash-hero-orb--2" />
            <div className="dash-hero-orb dash-hero-orb--3" />
            <span className="dash-hero-icon">◈</span>
          </div>
        </section>

        {/* Stats */}
        <section className="dash-stats stagger" aria-label="Statistics">
          <DashboardCard
            icon="⬡"
            label="Total Jobs"
            value={stats.total}
            accent="#6366f1"
            delay={0}
          />
          <DashboardCard
            icon="✓"
            label="Completed"
            value={stats.completed}
            accent="#22c55e"
            delay={80}
          />
          <DashboardCard
            icon="🖼"
            label="Images Processed"
            value={stats.totalImg.toLocaleString()}
            accent="#38bdf8"
            delay={160}
          />
          <DashboardCard
            icon="👥"
            label="Clusters Found"
            value={stats.totalClusters.toLocaleString()}
            accent="#f59e0b"
            delay={240}
          />
        </section>

        {/* Interactive Jobs Command Center */}
        <section className="dash-recent" aria-labelledby="recent-heading">
          <div className="dash-section-header">
            <h2 id="recent-heading" className="dash-section-title">Clustering Jobs</h2>
          </div>

          {/* Controls Bar */}
          <div className="dash-controls animate-fade-in-up">
            <div className="dash-search-wrapper">
              <span className="dash-search-icon">🔍</span>
              <input
                type="text"
                className="dash-search-input"
                placeholder="Search by job name, ID, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search jobs"
              />
            </div>
            
            <div className="dash-sort-wrapper">
              <span className="dash-sort-label">Sort By:</span>
              <select
                className="dash-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort jobs"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="images-desc">Most Images</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>

          {/* Jobs Table/Grid */}
          <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            {loading ? (
              <div className="history-table-wrapper">
                <table className="history-table" aria-label="Loading jobs list">
                  <thead>
                    <tr>
                      <th>Job Name</th>
                      <th>Job ID</th>
                      <th>Images</th>
                      <th>Clusters</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <tr key={idx}>
                        <td><div className="skeleton-line" style={{ width: '120px', height: '16px' }} /></td>
                        <td><div className="skeleton-line" style={{ width: '180px', height: '16px' }} /></td>
                        <td><div className="skeleton-line" style={{ width: '40px', height: '16px', margin: '0 auto' }} /></td>
                        <td><div className="skeleton-line" style={{ width: '40px', height: '16px', margin: '0 auto' }} /></td>
                        <td><div className="skeleton-line" style={{ width: '110px', height: '16px' }} /></td>
                        <td><div className="skeleton-line" style={{ width: '80px', height: '24px', borderRadius: '12px' }} /></td>
                        <td><div className="skeleton-line" style={{ width: '140px', height: '30px' }} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : error ? (
              <div className="empty-state glass-card">
                <span className="empty-state-icon" aria-hidden="true">⚠️</span>
                <p>{error}</p>
                <button className="btn btn-secondary btn-sm" onClick={() => fetchJobs(true)}>
                  Try Again
                </button>
              </div>
            ) : filteredAndSortedJobs.length === 0 ? (
              <div className="empty-state glass-card">
                <span className="empty-state-icon" aria-hidden="true" style={{ fontSize: '3.5rem', opacity: 0.5 }}>📂</span>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 'var(--space-xs) 0' }}>No Jobs Found</h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto var(--space-md) auto' }}>
                  {searchQuery 
                    ? "We couldn't find any clustering jobs matching your search filters. Try clearing your search or typing a different query." 
                    : "You haven't uploaded or run any face clustering jobs yet. Get started by uploading your first image collection!"
                  }
                </p>
                {!searchQuery ? (
                  <Link to="/upload" className="btn btn-primary btn-lg">
                    ↑ &nbsp;Upload Images
                  </Link>
                ) : (
                  <button className="btn btn-secondary" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="history-table-wrapper">
                <table className="history-table" aria-label="Jobs command center">
                  <thead>
                    <tr>
                      <th>Job Name</th>
                      <th>Status</th>
                      <th>Images</th>
                      <th>Clusters</th>
                      <th>Upload Date</th>
                      <th>Progress / Completion</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedJobs.map((job, i) => {
                      const isEditingName = editingJobId === job.id
                      const defaultJobName = "Face Clustering Run"
                      const currentJobName = customNames[job.id] || defaultJobName

                      const isReclustering = reclusteringIds.has(job.id)
                      const isDownloading = downloadingIds.has(job.id)
                      
                      return (
                        <tr key={job.id} className="history-row" style={{ animationDelay: `${i * 30}ms` }}>
                          
                          {/* Job Name with Inline Edit */}
                          <td>
                            {isEditingName ? (
                              <input
                                type="text"
                                className="job-name-input"
                                value={editNameValue}
                                onChange={(e) => setEditNameValue(e.target.value)}
                                onBlur={() => handleSaveRename(job.id)}
                                onKeyDown={(e) => handleKeyDownRename(e, job.id)}
                                autoFocus
                              />
                            ) : (
                              <div className="job-name-cell">
                                <span className="job-name-display" title={currentJobName}>
                                  {currentJobName}
                                </span>
                                <button
                                  className="job-name-edit-btn"
                                  onClick={() => handleStartRename(job.id, currentJobName)}
                                  title="Rename job"
                                  aria-label={`Rename ${currentJobName}`}
                                >
                                  ✏️
                                </button>
                              </div>
                            )}
                          </td>
                          
                          {/* Status */}
                          <td>
                            <StatusBadge status={job.status} />
                          </td>
                          
                          {/* Images count */}
                          <td className="history-num">{job.total_images ?? '—'}</td>
                          
                          {/* Clusters count */}
                          <td className="history-num">{job.total_clusters ?? '—'}</td>
                          
                          {/* Upload Date */}
                          <td className="history-date">{formatDate(job.created_at)}</td>
                          
                          {/* Progress */}
                          <td>
                            {job.status === 'PROCESSING' || job.status === 'PENDING' ? (
                              <div className="dash-progress-wrapper">
                                <span className="dash-progress-text">{job.progress || 0}% complete</span>
                                <div className="dash-progress-track">
                                  <div className="dash-progress-fill" style={{ width: `${job.progress || 0}%` }} />
                                </div>
                              </div>
                            ) : job.status === 'COMPLETED' ? (
                              <span className="text-success" style={{ fontWeight: 600 }}>100% complete</span>
                            ) : (
                              <span className="text-danger" style={{ fontWeight: 600 }}>Failed</span>
                            )}
                          </td>
                          
                          {/* Actions */}
                          <td>
                            <div className="dash-actions-cell">
                              {/* View */}
                              {job.status === 'COMPLETED' ? (
                                <Link
                                  to={`/results/${job.id}`}
                                  className="dash-action-btn btn-view"
                                  title="View Results"
                                  aria-label={`View results for ${currentJobName}`}
                                >
                                  👁️
                                </Link>
                              ) : (
                                <Link
                                  to={`/processing/${job.id}`}
                                  className="dash-action-btn btn-view"
                                  title="Check Status"
                                  aria-label={`Check status for ${currentJobName}`}
                                >
                                  👁️
                                </Link>
                              )}

                              {/* Re-cluster */}
                              <button
                                className="dash-action-btn btn-recluster"
                                onClick={() => handleReclusterClick(job.id)}
                                disabled={isReclustering || job.status === 'PENDING' || job.status === 'PROCESSING'}
                                title={isReclustering ? "Scheduling..." : "Re-run clustering"}
                                aria-label={`Re-run clustering for ${currentJobName}`}
                              >
                                🔄
                              </button>

                              {/* Download */}
                              <button
                                className="dash-action-btn btn-download"
                                onClick={() => handleDownloadClick(job.id)}
                                disabled={isDownloading || job.status !== 'COMPLETED'}
                                title={isDownloading ? "Downloading..." : "Download ZIP results"}
                                aria-label={`Download results for ${currentJobName}`}
                              >
                                📥
                              </button>

                              {/* Delete */}
                              <button
                                className="dash-action-btn btn-delete"
                                onClick={() => handleDeleteClick(job)}
                                disabled={isReclustering || isDownloading}
                                title="Delete job"
                                aria-label={`Delete job ${currentJobName}`}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* How it works */}
        <section className="dash-how" aria-labelledby="how-heading">
          <h2 id="how-heading" className="dash-section-title">How it works</h2>
          <div className="dash-steps stagger">
            {[
              { n: '01', title: 'Upload',   desc: 'Drop images or a ZIP archive. Supports up to 500 images.', icon: '↑' },
              { n: '02', title: 'AI Analysis', desc: 'InsightFace detects faces and generates 512-dim ArcFace embeddings.', icon: '⚙' },
              { n: '03', title: 'Clustering', desc: 'DBSCAN groups faces by identity — no prior labels required.', icon: '◈' },
              { n: '04', title: 'Results',  desc: 'Browse face clusters with confidence scores per image.',   icon: '✓' },
            ].map((step) => (
              <div key={step.n} className="dash-step glass-card animate-fade-in-up">
                <div className="dash-step-num">{step.n}</div>
                <div className="dash-step-icon" aria-hidden="true">{step.icon}</div>
                <h3 className="dash-step-title">{step.title}</h3>
                <p className="dash-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Deletion Confirmation Dialog Modal */}
      {deleteConfirmJob && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
          <div className="modal-content">
            <div className="modal-header">
              <span className="modal-warning-icon" aria-hidden="true">⚠️</span>
              <h3 id="delete-modal-title" className="modal-title">Confirm Delete</h3>
            </div>
            
            <div className="modal-body">
              <p>Are you sure you want to delete this job?</p>
              <p style={{ color: '#fbbf24', fontWeight: 600 }}>
                This will perform a soft delete. The job will be archived and hidden from your dashboard history. Your uploaded files and database records will be flagged as deleted in the backend to ensure your workspace remains clean.
              </p>
              
              <div className="modal-item-details">
                <div className="modal-item-row">
                  <span>Job Name:</span>
                  <span className="modal-item-value">
                    {customNames[deleteConfirmJob.id] || "Face Clustering Run"}
                  </span>
                </div>
                <div className="modal-item-row">
                  <span>Job ID:</span>
                  <span className="modal-item-value">{deleteConfirmJob.id}</span>
                </div>
                <div className="modal-item-row">
                  <span>Total Images:</span>
                  <span className="modal-item-value">{deleteConfirmJob.total_images ?? 0}</span>
                </div>
                <div className="modal-item-row">
                  <span>Upload Date:</span>
                  <span className="modal-item-value">{formatDate(deleteConfirmJob.created_at)}</span>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirmJob(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                style={{ background: '#ef4444', borderColor: '#ef4444', color: '#fff' }}
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
