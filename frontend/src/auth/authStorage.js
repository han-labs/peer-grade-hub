const STORAGE_KEY = 'peergrade.auth'

function parseStoredSession(value) {
  if (!value) {
    return null
  }

  try {
    const session = JSON.parse(value)
    return session?.token ? session : null
  } catch {
    return null
  }
}

export function readStoredSession() {
  return (
    parseStoredSession(sessionStorage.getItem(STORAGE_KEY)) ??
    parseStoredSession(localStorage.getItem(STORAGE_KEY))
  )
}

export function storeSession(session, rememberMe) {
  clearStoredSession()
  const storage = rememberMe ? localStorage : sessionStorage
  storage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearStoredSession() {
  sessionStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(STORAGE_KEY)
}
