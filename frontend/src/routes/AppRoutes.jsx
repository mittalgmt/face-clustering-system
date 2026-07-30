import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Dashboard  from '../pages/Dashboard'
import Upload     from '../pages/Upload'
import Processing from '../pages/Processing'
import Results    from '../pages/Results'
import History    from '../pages/History'
import Download   from '../pages/Download'
import UserGuide  from '../pages/UserGuide'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index              element={<Dashboard />}  />
        <Route path="upload"      element={<Upload />}     />
        <Route path="processing/:jobId" element={<Processing />} />
        <Route path="results/:jobId"    element={<Results />}    />
        <Route path="jobs/:jobId/download" element={<Download />} />
        <Route path="history"     element={<History />}   />
        <Route path="guide"       element={<UserGuide />}   />
        {/* Fallback */}
        <Route path="*"           element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
