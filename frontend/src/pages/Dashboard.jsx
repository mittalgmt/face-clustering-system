import { Link } from 'react-router-dom'
import DashboardCard from '../components/DashboardCard'
import HistoryTable from '../components/HistoryTable'
import './Dashboard.css'

const HISTORY_KEY = 'faceClusterHistory'

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

function computeStats(history) {
  const total      = history.length
  const completed  = history.filter((j) => j.status === 'COMPLETED').length
  const totalImg   = history.reduce((s, j) => s + (j.total_images || 0), 0)
  const totalClusters = history.reduce((s, j) => s + (j.total_clusters || 0), 0)
  return { total, completed, totalImg, totalClusters }
}

export default function Dashboard() {
  const history = getHistory()
  const stats   = computeStats(history)
  const recent  = history.slice(0, 5)

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
              <Link to="/history" className="btn btn-secondary btn-lg">
                View History
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

        {/* Recent Jobs */}
        <section className="dash-recent" aria-labelledby="recent-heading">
          <div className="dash-section-header">
            <h2 id="recent-heading" className="dash-section-title">Recent Jobs</h2>
            <Link to="/history" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          <HistoryTable jobs={recent} />
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
    </div>
  )
}
