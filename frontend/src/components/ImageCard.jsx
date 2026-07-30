import { useState } from 'react'
import './ImageCard.css'

const FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect fill='%230d1424' width='80' height='80'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='28' fill='%234b5a73'%3E👤%3C/text%3E%3C/svg%3E"

/** Extract just the filename from a full path like uploads/2026/07/29/img.jpg */
function basename(path) {
  if (!path) return ''
  return path.replace(/\\/g, '/').split('/').pop()
}

/**
 * Individual face image thumbnail.
 * @param {{ filename: string, imageUrl: string, confidence: number, distanceToCentroid?: number }} props
 */
export default function ImageCard({ filename, imageUrl, confidence, distanceToCentroid, onClick, isEditing, allClusters = [], onMove, onRemove }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const isLowConfidence = confidence < 60
  
  const badgeClass =
    confidence >= 80 ? 'image-card-badge--high' :
    confidence >= 60 ? 'image-card-badge--medium' :
    'image-card-badge--low'

  const displayName = basename(filename)

  return (
    <div
      className={`image-card ${isLowConfidence ? 'image-card--low-confidence' : ''}`}
      title={displayName}
      onClick={isEditing ? undefined : onClick}
      style={{ cursor: isEditing ? 'default' : 'pointer', position: 'relative' }}
    >
      <div className="image-card-thumb">
        <img
          src={imageUrl}
          alt={displayName}
          loading="lazy"
          onError={(e) => { e.target.src = FALLBACK }}
        />
        <div className="image-card-badge-container">
          <span className={`image-card-badge ${badgeClass}`}>
            {isLowConfidence && <span className="image-card-warning-indicator">⚠️</span>}
            {confidence.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="image-card-footer">
        <span className="image-card-name">{displayName}</span>
        {distanceToCentroid != null && (
          <span className="image-card-dist" title="Distance to centroid">
            Δ {distanceToCentroid.toFixed(3)}
          </span>
        )}
      </div>

      {isEditing && (
        <div className="image-card-edit-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="move-dropdown-wrapper">
            <button
              className="image-card-edit-btn btn-move-face"
              title="Move face to another profile"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              ⇄
            </button>
            {dropdownOpen && (
              <div className="move-dropdown-menu">
                {allClusters.map((c) => (
                  <button
                    key={c.id}
                    className="move-dropdown-item"
                    onClick={() => {
                      onMove(filename, c.id)
                      setDropdownOpen(false)
                    }}
                  >
                    Move to {c.name}
                  </button>
                ))}
                <button
                  className="move-dropdown-item move-dropdown-item--create"
                  onClick={() => {
                    onMove(filename, 'NEW')
                    setDropdownOpen(false)
                  }}
                >
                  + Create New Profile
                </button>
                <button
                  className="move-dropdown-item move-dropdown-item--noise"
                  onClick={() => {
                    onRemove(filename)
                    setDropdownOpen(false)
                  }}
                >
                  ⚠️ Exclude (Needs Review)
                </button>
              </div>
            )}
          </div>
          <button
            className="image-card-edit-btn btn-remove-face"
            title="Remove from this profile"
            onClick={() => onRemove(filename)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
