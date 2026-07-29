import { useState } from 'react'
import ImageCard from './ImageCard'
import { getImageUrl } from '../api/clustersApi'
import './ClusterCard.css'

/**
 * Card displaying one cluster with its face thumbnails.
 * @param {{ cluster: {id, cluster_number, image_count, images} }} props
 */
export default function ClusterCard({ cluster }) {
  const [expanded, setExpanded] = useState(false)

  const displayImages = expanded ? cluster.images : cluster.images.slice(0, 6)
  const remaining = cluster.images.length - 6

  return (
    <article className="cluster-card glass-card" aria-label={`Cluster ${cluster.cluster_number}`}>
      {/* Header */}
      <div className="cluster-card-header">
        <div className="cluster-card-title">
          <span className="cluster-card-number">#{cluster.cluster_number}</span>
          <div>
            <h3 className="cluster-card-heading">Person {cluster.cluster_number + 1}</h3>
            <span className="cluster-card-count">
              {cluster.image_count} photo{cluster.image_count !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <span className="cluster-card-badge">{cluster.image_count}</span>
      </div>

      {/* Image Strip */}
      <div className="cluster-card-grid">
        {displayImages.map((img) => (
          <ImageCard
            key={img.filename}
            filename={img.filename}
            imageUrl={getImageUrl(img.filename)}
            confidence={img.confidence}
            distanceToCentroid={img.distance_to_centroid}
          />
        ))}
      </div>

      {/* Expand / Collapse */}
      {cluster.images.length > 6 && (
        <button
          id={`cluster-${cluster.id}-expand`}
          className="cluster-card-expand btn btn-ghost btn-sm"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          {expanded
            ? '▲ Show less'
            : `▼ Show ${remaining} more`}
        </button>
      )}
    </article>
  )
}
