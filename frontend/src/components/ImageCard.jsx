import './ImageCard.css'

const FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect fill='%230d1424' width='80' height='80'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='28' fill='%234b5a73'%3E👤%3C/text%3E%3C/svg%3E"

/** Extract just the filename from a full path like uploads/2026/07/29/img.jpg */
function basename(path) {
  if (!path) return ''
  return path.split('/').pop()
}

/**
 * Individual face image thumbnail.
 * @param {{ filename: string, imageUrl: string, confidence: number, distanceToCentroid?: number }} props
 */
export default function ImageCard({ filename, imageUrl, confidence, distanceToCentroid }) {
  const confColor =
    confidence >= 80 ? 'var(--success)' :
    confidence >= 60 ? 'var(--warning)' :
    'var(--error)'

  const displayName = basename(filename)

  return (
    <div className="image-card" title={displayName}>
      <div className="image-card-thumb">
        <img
          src={imageUrl}
          alt={displayName}
          loading="lazy"
          onError={(e) => { e.target.src = FALLBACK }}
        />
        <div className="image-card-overlay">
          <span
            className="image-card-confidence"
            style={{ color: confColor }}
          >
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
    </div>
  )
}
