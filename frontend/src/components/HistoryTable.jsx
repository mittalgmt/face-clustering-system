import { Link } from 'react-router-dom'
import './HistoryTable.css'

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

/**
 * Table of past processing jobs from localStorage history.
 * @param {{ jobs: Array }} props
 */
export default function HistoryTable({ jobs }) {
  if (!jobs || jobs.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon" aria-hidden="true">📂</span>
        <p>No previous jobs found.</p>
        <Link to="/upload" className="btn btn-primary btn-sm">Upload Images</Link>
      </div>
    )
  }

  return (
    <div className="history-table-wrapper">
      <table className="history-table" aria-label="Job history">
        <thead>
          <tr>
            <th>Job ID</th>
            <th>Status</th>
            <th>Images</th>
            <th>Clusters</th>
            <th>Created</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job, i) => (
            <tr key={job.job_id} className="history-row" style={{ animationDelay: `${i * 40}ms` }}>
              <td>
                <span className="history-job-id" title={job.job_id}>
                  {job.job_id.slice(0, 8)}…
                </span>
              </td>
              <td><StatusBadge status={job.status} /></td>
              <td className="history-num">{job.total_images ?? '—'}</td>
              <td className="history-num">{job.total_clusters ?? '—'}</td>
              <td className="history-date">{formatDate(job.created_at)}</td>
              <td>
                {job.status === 'COMPLETED' ? (
                  <Link
                    to={`/results/${job.job_id}`}
                    className="btn btn-secondary btn-sm"
                    id={`view-results-${job.job_id.slice(0,8)}`}
                  >
                    View Results
                  </Link>
                ) : job.status === 'PROCESSING' || job.status === 'PENDING' ? (
                  <Link
                    to={`/processing/${job.job_id}`}
                    className="btn btn-secondary btn-sm"
                  >
                    Check Status
                  </Link>
                ) : (
                  <span className="history-failed">Failed</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
