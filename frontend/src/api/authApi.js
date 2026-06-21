import { apiRequest } from './httpClient.js'

export async function login(usernameOrEmail, password, rememberMe) {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ usernameOrEmail, password, rememberMe }),
  })

  return response.data
}

export async function getCurrentUser(token) {
  const response = await apiRequest('/auth/me', { token })
  return response.data
}

export async function getBackendHealth() {
  return apiRequest('/health')
}
