import { NavLink, useLocation } from 'react-router-dom'
import './Navbar.css'

const NAV_LINKS = [
  { to: '/',        label: 'Dashboard', icon: '⬡' },
  { to: '/upload',  label: 'Upload',    icon: '↑' },
  { to: '/history', label: 'History',   icon: '◷' },
  { to: '/guide',   label: 'User Guide', icon: '📖' },
]

export default function Navbar() {
  const location = useLocation()

  return (
    <header className="navbar" role="banner">
      <div className="navbar-inner container">
        {/* Logo */}
        <NavLink to="/" className="navbar-logo" aria-label="FaceCluster Home">
          <span className="navbar-logo-icon">◈</span>
          <span className="navbar-logo-text">
            Face<span className="text-gradient">Cluster</span>
          </span>
        </NavLink>

        {/* Nav Links */}
        <nav className="navbar-links" aria-label="Main navigation">
          {NAV_LINKS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `navbar-link ${isActive ? 'navbar-link--active' : ''}`
              }
            >
              <span className="navbar-link-icon" aria-hidden="true">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* CTA */}
        <NavLink to="/upload" className="btn btn-primary btn-sm navbar-cta">
          + New Job
        </NavLink>
      </div>
    </header>
  )
}
