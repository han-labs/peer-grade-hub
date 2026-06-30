import { Navigate, useLocation } from 'react-router-dom'
import LoadingScreen from '../components/LoadingScreen.jsx'
import { useAuth } from './useAuth.js'

function getDashboardPath(role) {
  if (role === 'LECTURER') return '/lecturer'
  if (role === 'ADMINISTRATOR') return '/admin'
  return '/student'
}

function normalizeRole(role) {
  return typeof role === 'string' && role.startsWith('ROLE_')
    ? role.slice(5)
    : role
}

function ProtectedRoute({ allowedRoles, children }) {
  const { user, isInitializing } = useAuth()
  const location = useLocation()
  const intendedPath = `${location.pathname}${location.search}${location.hash}`
  const userRole = normalizeRole(user?.role)

  if (isInitializing) {
    return <LoadingScreen label="Restoring your workspace" />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: intendedPath }} />
  }

  if (allowedRoles?.length && !allowedRoles.includes(userRole)) {
    return <Navigate to={getDashboardPath(userRole)} replace />
  }

  return children
}

export default ProtectedRoute
