import { useState } from 'react'
import { Link } from 'react-router-dom'
import HistoryTable from '../components/HistoryTable'
import './History.css'

const HISTORY_KEY = 'faceClusterHistory'

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

export default function History() {
  const [jobs, setJobs] = useState(() => getHistory())

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY)
    setJobs([])
  }

  return (
    <div className="page history-page">
      <div className="container">

        {/* Header */}
        <header className="history-header animate-fade-in-up">
          <div>
            <h1 className="history-title">
              Job <span className="text-gradient">History</span>
            </h1>
            <p className="history-subtitle">
              {jobs.length} job{jobs.length !== 1 ? 's' : ''} in this browser session
            </p>
          </div>
          <div className="history-actions">
            <Link to="/upload" className="btn btn-primary" id="new-upload-btn">
              + New Upload
            </Link>
            {jobs.length > 0 && (
              <button
                id="clear-history-btn"
                className="btn btn-secondary"
                onClick={clearHistory}
                aria-label="Clear all history"
              >
                Clear All
              </button>
            )}
          </div>
        </header>

        {/* Table */}
        <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <HistoryTable jobs={jobs} />
        </div>

        {/* Notice */}
        <p className="history-notice animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          ⚠ History is stored locally in this browser. It will be lost if you clear browser data.
        </p>

      </div>
    </div>
  )
}
