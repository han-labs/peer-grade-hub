import { LogOut } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import BrandMark from './BrandMark.jsx'

function DashboardTopbar({ icon: Icon, label }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const roleAccent = user.role.toLowerCase()
  const initials = useMemo(
    () =>
      user.fullName
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase(),
    [user.fullName],
  )

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="topbar">
      <BrandMark compact />
      <nav className="topbar__nav" aria-label="Primary navigation">
        <span className="topbar__active">
          <Icon size={18} aria-hidden="true" />
          {label}
        </span>
      </nav>
      <div className="topbar__account">
        <span className={`user-avatar user-avatar--${roleAccent}`}>{initials}</span>
        <span className="topbar__identity">
          <strong>{user.fullName}</strong>
          <small>@{user.username}</small>
        </span>
        <button className="logout-button" onClick={handleLogout} type="button">
          <LogOut size={18} aria-hidden="true" />
          <span>Log out</span>
        </button>
      </div>
    </header>
  )
}

export default DashboardTopbar
