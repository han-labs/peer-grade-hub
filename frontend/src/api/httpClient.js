export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'
).replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'NETWORK_ERROR', payload = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.payload = payload
  }
}

export async function apiRequest(path, { token, headers, ...options } = {}) {
  const requestHeaders = {
    Accept: 'application/json',
    ...headers,
  }

  if (options.body) {
    requestHeaders['Content-Type'] = 'application/json'
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`
  }

  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: requestHeaders,
    })
  } catch {
    throw new ApiError('Unable to connect to PeerGrade Hub. Please try again.')
  }

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : null

  if (!response.ok || payload?.success === false) {
    throw new ApiError(
      payload?.message ?? `Request failed with status ${response.status}.`,
      {
        status: response.status,
        code: payload?.code ?? 'REQUEST_FAILED',
        payload,
      },
    )
  }

  return payload
}
