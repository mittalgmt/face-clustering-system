import './DashboardCard.css'

/**
 * Stat card for the dashboard.
 * @param {{ icon: string, label: string, value: string|number, accent?: string, delay?: number }} props
 */
export default function DashboardCard({ icon, label, value, accent, delay = 0 }) {
  return (
    <div
      className="dash-card glass-card animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="dash-card-icon"
        style={accent ? { background: `${accent}18`, color: accent } : {}}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="dash-card-body">
        <span className="dash-card-value">{value ?? '—'}</span>
        <span className="dash-card-label">{label}</span>
      </div>
    </div>
  )
}
