import { apiRequest } from './httpClient.js'

const ROLE_DASHBOARD_PATHS = {
  ADMINISTRATOR: '/dashboard/admin',
  LECTURER: '/dashboard/lecturer',
  STUDENT: '/dashboard/student',
}

export async function getRoleDashboard(role, token) {
  const path = ROLE_DASHBOARD_PATHS[role]

  if (!path) {
    return null
  }

  const response = await apiRequest(path, { token })
  return response.data
}
