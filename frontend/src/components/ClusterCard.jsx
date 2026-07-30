import { useState } from 'react'
import ImageCard from './ImageCard'
import { getImageUrl } from '../api/clustersApi'
import './ClusterCard.css'

/**
 * Card displaying one cluster with its face thumbnails.
 * @param {{ cluster: {id, cluster_number, image_count, images} }} props
 */
export default function ClusterCard({ cluster, onImageClick, isEditing, allClusters = [], onRename, onMoveImage, onRemoveImage }) {
  const [expanded, setExpanded] = useState(false)

  const displayImages = expanded || isEditing ? cluster.images : cluster.images.slice(0, 6)
  const remaining = cluster.images.length - 6
  
  const clusterDisplayName = cluster.cluster_name || `Person ${cluster.cluster_number + 1}`

  return (
    <article className="cluster-card glass-card" aria-label={`Cluster ${cluster.cluster_number}`}>
      {/* Header */}
      <div className="cluster-card-header">
        <div className="cluster-card-title">
          <span className="cluster-card-number">#{cluster.cluster_number}</span>
          <div>
            {isEditing ? (
              <input
                type="text"
                className="cluster-card-rename-input"
                value={cluster.cluster_name !== undefined ? cluster.cluster_name : `Person ${cluster.cluster_number + 1}`}
                placeholder={`Person ${cluster.cluster_number + 1}`}
                onChange={(e) => onRename && onRename(cluster.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <h3 className="cluster-card-heading">{clusterDisplayName}</h3>
            )}
            <span className="cluster-card-count">
              {cluster.images.length} photo{cluster.images.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <span className="cluster-card-badge">{cluster.images.length}</span>
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
            onClick={() => onImageClick && onImageClick({
              filename: img.filename,
              imageUrl: getImageUrl(img.filename),
              confidence: img.confidence,
              distanceToCentroid: img.distance_to_centroid,
              clusterName: clusterDisplayName,
              status: 'COMPLETED'
            })}
            isEditing={isEditing}
            allClusters={allClusters}
            onMove={onMoveImage}
            onRemove={onRemoveImage}
          />
        ))}
      </div>

      {/* Expand / Collapse */}
      {cluster.images.length > 6 && !isEditing && (
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
