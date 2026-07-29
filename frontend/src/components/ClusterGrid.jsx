import ClusterCard from './ClusterCard'
import './ClusterGrid.css'

/**
 * Responsive grid of cluster cards.
 * @param {{ clusters: Array }} props
 */
export default function ClusterGrid({ clusters }) {
  if (!clusters || clusters.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon" aria-hidden="true">🔍</span>
        <p>No clusters found for this job.</p>
      </div>
    )
  }

  return (
    <div className="cluster-grid">
      {clusters.map((cluster, i) => (
        <ClusterCard
          key={cluster.id}
          cluster={cluster}
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  )
}
