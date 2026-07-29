import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import './MainLayout.css'

export default function MainLayout() {
  return (
    <div className="layout">
      <Navbar />
      <main className="layout-main" id="main-content">
        <Outlet />
      </main>
      <footer className="layout-footer">
        <div className="container layout-footer-inner">
          <span>© {new Date().getFullYear()} FaceCluster — AI Face Clustering System</span>
          <span className="layout-footer-tag">Powered by InsightFace · DBSCAN · Django</span>
        </div>
      </footer>
    </div>
  )
}
