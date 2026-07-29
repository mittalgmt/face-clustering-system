import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Dashboard  from '../pages/Dashboard'
import Upload     from '../pages/Upload'
import Processing from '../pages/Processing'
import Results    from '../pages/Results'
import History    from '../pages/History'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index              element={<Dashboard />}  />
        <Route path="upload"      element={<Upload />}     />
        <Route path="processing/:jobId" element={<Processing />} />
        <Route path="results/:jobId"    element={<Results />}    />
        <Route path="history"     element={<History />}   />
        {/* Fallback */}
        <Route path="*"           element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
