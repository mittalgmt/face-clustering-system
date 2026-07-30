import { useState } from 'react'
import './UserGuide.css'

export default function UserGuide() {
  const [activeChapter, setActiveChapter] = useState(0)

  const chapters = [
    {
      title: "Dashboard",
      icon: "⬡",
      content: (
        <>
          <p className="guide-body-text">
            The Dashboard acts as your central command history list. It lists every face clustering job run on the platform, showing upload metrics, status badges, and processing results.
          </p>
          <div className="guide-grid-list">
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">📂 View All Jobs</span>
              <span className="guide-grid-card-desc">Monitor past clustering runs, total processed images, completion date, and number of established identity profiles.</span>
            </div>
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">⚡ Check Statuses</span>
              <span className="guide-grid-card-desc">Identify active jobs (Pending, Processing), successful groupings (Completed), or failures needing parameter retries.</span>
            </div>
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">👁️ Open Results</span>
              <span className="guide-grid-card-desc">Click the eye icon (👁️) to examine generated face directories, adjust parameters, or edit profiles.</span>
            </div>
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">🗑️ Delete Runs</span>
              <span className="guide-grid-card-desc">Click the trash icon to archive runs from history. Soft delete hides jobs from view immediately while keeping records safe.</span>
            </div>
          </div>
        </>
      )
    },
    {
      title: "Upload Images",
      icon: "↑",
      content: (
        <>
          <p className="guide-body-text">
            To start grouping faces, you select your photo collections and initiate the upload step. You can upload single images, folders, or ZIP archives.
          </p>
          <div className="guide-grid-list">
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">📁 Choose Source</span>
              <span className="guide-grid-card-desc">Select individual images or drag a ZIP package (up to 500MB, containing maximum 500 files).</span>
            </div>
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">🖼️ Supported Formats</span>
              <span className="guide-grid-card-desc">Supports standard image types: JPEG/JPG, PNG, WEBP, and BMP. Files under 10MB each.</span>
            </div>
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">📝 Custom Run Name</span>
              <span className="guide-grid-card-desc">Type a friendly job name (e.g. "Graduation Ceremony") so you can easily find it later in the history index.</span>
            </div>
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">🚀 Start Scanning</span>
              <span className="guide-grid-card-desc">Click "Start Clustering" button. The server extracts files, skips duplicates, and schedules background tasks.</span>
            </div>
          </div>
        </>
      )
    },
    {
      title: "Processing",
      icon: "⚙️",
      content: (
        <>
          <p className="guide-body-text">
            While processing, our background pipeline executes machine learning models. You can monitor progress on the stepper ring.
          </p>
          
          {/* visual flow */}
          <div className="guide-steps-flow">
            <div className="guide-flow-step">
              <div className="guide-flow-circle">🔍</div>
              <span>Face Detection</span>
            </div>
            <div className="guide-flow-line" />
            <div className="guide-flow-step">
              <div className="guide-flow-circle">🧬</div>
              <span>Feature Scan</span>
            </div>
            <div className="guide-flow-line" />
            <div className="guide-flow-step">
              <div className="guide-flow-circle">👥</div>
              <span>DBSCAN Grouping</span>
            </div>
            <div className="guide-flow-line" />
            <div className="guide-flow-step">
              <div className="guide-flow-circle">✨</div>
              <span>Completed</span>
            </div>
          </div>

          <div className="guide-grid-list">
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">1. Detection Phase</span>
              <span className="guide-grid-card-desc">Scans each image to locate human face regions, cropping out non-face borders.</span>
            </div>
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">2. Embedding extraction</span>
              <span className="guide-grid-card-desc">Extracts facial coordinates (eye spacing, jawline) and converts them into numeric math signatures (vectors).</span>
            </div>
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">3. DBSCAN clustering</span>
              <span className="guide-grid-card-desc">Groups similar feature signatures together. Outliers are marked as Noise.</span>
            </div>
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">4. Auto Redirect</span>
              <span className="guide-grid-card-desc">No polling needed. Once progress hits 100%, you are redirected to the Results tab instantly.</span>
            </div>
          </div>
        </>
      )
    },
    {
      title: "Clustering Results",
      icon: "👥",
      content: (
        <>
          <p className="guide-body-text">
            The results page presents a dashboard detailing all grouped profiles, unclustered images, and match scores.
          </p>
          <div className="guide-grid-list">
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">👥 Grouped Profiles</span>
              <span className="guide-grid-card-desc">Matches are presented in cards. Click any card to expand thumbnail crops and filenames.</span>
            </div>
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">⭐ Confidence Metrics</span>
              <span className="guide-grid-card-desc">Each match has a confidence score. Ratings above 75% show optimal lighting and frontal face angles.</span>
            </div>
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">⚠️ Needs Review Tab</span>
              <span className="guide-grid-card-desc">Outliers and failed reads are separated here. Displays checklists showing why (e.g. side profile, blur, duplicate).</span>
            </div>
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">📊 Size Distribution</span>
              <span className="guide-grid-card-desc">A bar chart showing the size of each identity group, helping you scan dominant faces instantly.</span>
            </div>
          </div>
        </>
      )
    },
    {
      title: "Edit Results",
      icon: "✏️",
      content: (
        <>
          <p className="guide-body-text">
            If face classifications are not fully accurate, enter "Edit Mode" to refine and customize your directories layout sandbox.
          </p>
          <div className="guide-grid-list">
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">🏷️ Rename Profiles</span>
              <span className="guide-grid-card-desc">Type names directly inside input boxes to change generic labels like "Person 1" to "John Doe".</span>
            </div>
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">🔄 Move Images</span>
              <span className="guide-grid-card-desc">Click the arrows swap icon on thumbnails to move a face to an existing profile, or start a new group.</span>
            </div>
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">❌ Remove Faces</span>
              <span className="guide-grid-card-desc">Click the cross icon to remove a misclassified face from a profile, sending it back to the review board.</span>
            </div>
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">💾 Non-Persistent Drafts</span>
              <span className="guide-grid-card-desc">Edits are saved as draft states in browser memory, keeping original AI data intact until you click "Save Changes".</span>
            </div>
          </div>
        </>
      )
    },
    {
      title: "Re-cluster",
      icon: "🔄",
      content: (
        <>
          <p className="guide-body-text">
            If the AI generated too many tiny groups or merged lookalikes, click "Re-cluster" to re-run grouping with new parameters.
          </p>
          <div className="guide-grid-list">
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">⚡ Strictness tuning</span>
              <span className="guide-grid-card-desc">Modify Match Strictness (Epsilon). Lower values require exact matching checks. Higher values are relaxed, merging similar faces.</span>
            </div>
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">👥 Group Sizes</span>
              <span className="guide-grid-card-desc">Tweak Minimum Group Size. Dictates the minimum number of matching photos needed to automatically form a profile folder.</span>
            </div>
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">⏳ Feature caching</span>
              <span className="guide-grid-card-desc">Takes milliseconds! Reuses existing ArcFace embedding floats, skipping face detection completely.</span>
            </div>
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">📁 Run versioning</span>
              <span className="guide-grid-card-desc">Spawns a new sub-job record in history, preserving your previous results intact under a separate URL.</span>
            </div>
          </div>
        </>
      )
    },
    {
      title: "Download",
      icon: "📥",
      content: (
        <>
          <p className="guide-body-text">
            Once you are satisfied with the grouping, navigate to the final step to export your files as a ZIP package.
          </p>
          <div className="guide-grid-list">
            <div className="guide-grid-card" style={{ gridColumn: 'span 2' }}>
              <span className="guide-grid-card-title">📁 Organized Folders Structure</span>
              <span className="guide-grid-card-desc" style={{ display: 'block', fontFamily: 'monospace', fontSize: 'var(--text-xs)', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: 'var(--radius-md)', marginTop: '6px' }}>
                ├── 📁 John Doe/  (Matches moved or renamed to John Doe)<br />
                ├── 📁 Person_2/ (Fallback name folders)<br />
                ├── 📁 Noise/    (Unclustered outlier photos)<br />
                └── 📁 Needs Review/ (Low-confidence files)
              </span>
            </div>
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">📦 Custom ZIP exports</span>
              <span className="guide-grid-card-desc">If you have custom layout edits saved, the export script automatically compiles folders using your names.</span>
            </div>
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">⚡ Check badges</span>
              <span className="guide-grid-card-desc">Presents badges verifying that files look clean, folders contain matches, and metadata compiles.</span>
            </div>
          </div>
        </>
      )
    },
    {
      title: "Delete Job",
      icon: "🗑️",
      content: (
        <>
          <p className="guide-body-text">
            Manage database clutter and preserve storage by cleaning up previous clustering runs.
          </p>
          <div className="guide-grid-list">
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">⚠️ Confirmation Warning</span>
              <span className="guide-grid-card-desc">Clicking Delete triggers a centered dialog explaining exactly what gets soft-deleted.</span>
            </div>
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">🔒 Archival soft delete</span>
              <span className="guide-grid-card-desc">Flags job status `is_deleted = True` and filters it out of lists, preventing access immediately.</span>
            </div>
          </div>
        </>
      )
    },
    {
      title: "Tips for Best Results",
      icon: "⭐",
      content: (
        <>
          <p className="guide-body-text">
            For maximum clustering accuracy, follow these guidelines when selecting your photos:
          </p>
          <div className="guide-grid-list">
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">☀️ Good lighting</span>
              <span className="guide-grid-card-desc">Avoid heavily underexposed (dark) or overexposed faces. Landscaping shadows prevent feature matches.</span>
            </div>
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">📷 Front angles</span>
              <span className="guide-grid-card-desc">Prefer direct frontal shots. Extreme side profiles or heavy head tilts (over 45 degrees) reduce match scores.</span>
            </div>
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">👥 One Face per Image</span>
              <span className="guide-grid-card-desc">While multi-face images are supported, keeping single portraits ensures clean matches without lookalike merges.</span>
            </div>
            <div className="guide-grid-card">
              <span className="guide-grid-card-title">🔄 Multiple Photos</span>
              <span className="guide-grid-card-desc">Provide 2 to 4 photos per individual. Isolated single photos are usually marked as outlier Noise.</span>
            </div>
          </div>
        </>
      )
    },
    {
      title: "FAQ",
      icon: "❓",
      content: (
        <div className="guide-faq-list">
          <div className="guide-faq-item">
            <h4 className="guide-faq-question">❓ Why wasn't my image clustered?</h4>
            <p className="guide-faq-answer">
              A: If the face was heavily tilted, blurry, dark, or if there was only one photo of that person, the AI classifies it as Noise because it did not find other matching features close enough to form a group.
            </p>
          </div>
          <div className="guide-faq-item">
            <h4 className="guide-faq-question">❓ What does "Needs Review" mean?</h4>
            <p className="guide-faq-answer">
              A: Represents images flagged with low confidence scores (under 60%) or files where no clear face borders could be detected. We recommend manually checking or moving them.
            </p>
          </div>
          <div className="guide-faq-item">
            <h4 className="guide-faq-question">❓ Can I edit the results?</h4>
            <p className="guide-faq-answer">
              A: Yes! Click "Edit Layout" on any results page. You can rename profiles, move images between cards, create new groups, or exclude items. Remember to click "Save Changes" when done.
            </p>
          </div>
          <div className="guide-faq-item">
            <h4 className="guide-faq-question">❓ Can I re-run clustering?</h4>
            <p className="guide-faq-answer">
              A: Yes! Click "Re-cluster" on the results page to tune strictness. The backend will instantly generate a new separate version of the dataset using the pre-computed facial features.
            </p>
          </div>
          <div className="guide-faq-item">
            <h4 className="guide-faq-question">❓ How do I get better accuracy?</h4>
            <p className="guide-faq-answer">
              A: Upload clear, high-resolution front-facing photos. If a person is misclassified, enter edit mode to adjust them manually, or lower/raise re-clustering strictness parameters.
            </p>
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="page guide-page">
      <div className="container">
        
        {/* Header */}
        <header className="guide-header animate-fade-in-up">
          <h1 className="guide-title">
            User <span className="text-gradient">Guide</span>
          </h1>
          <p className="guide-subtitle">
            Welcome! Learn how to upload, manage, edit, and export your face clustering runs with this step-by-step documentation.
          </p>
        </header>

        {/* Two-Column Split Layout */}
        <div className="guide-layout">
          
          {/* Left Sidebar Navigation */}
          <aside className="guide-sidebar animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            {chapters.map((chap, idx) => (
              <button
                key={idx}
                className={`guide-sidebar-item ${activeChapter === idx ? 'guide-sidebar-item--active' : ''}`}
                onClick={() => setActiveChapter(idx)}
              >
                <span className="guide-sidebar-icon">{chap.icon}</span>
                <span>{chap.title}</span>
              </button>
            ))}
          </aside>

          {/* Right Detail Content Card */}
          <main className="guide-detail-panel glass-card animate-fade-in-up" style={{ animationDelay: '180ms' }}>
            <div className="guide-detail-header">
              <div className="guide-detail-icon-box" aria-hidden="true">
                {chapters[activeChapter].icon}
              </div>
              <h2 className="guide-detail-title">{chapters[activeChapter].title}</h2>
            </div>
            <div className="guide-detail-divider" />
            <div className="guide-detail-body">
              {chapters[activeChapter].content}
            </div>
          </main>

        </div>

      </div>
    </div>
  )
}
