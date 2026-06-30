import { useCallback, useEffect, useMemo, useState } from 'react'
import * as authApi from '../api/authApi.js'
import { ApiError } from '../api/httpClient.js'
import {
  clearStoredSession,
  readStoredSession,
  storeSession,
} from './authStorage.js'
import { AuthContext } from './authContextValue.js'

function normalizeRole(role) {
  return typeof role === 'string' && role.startsWith('ROLE_')
    ? role.slice(5)
    : role
}

function normalizeUser(user) {
  return user ? { ...user, role: normalizeRole(user.role) } : user
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession())
  const [user, setUser] = useState(null)
  const [isInitializing, setIsInitializing] = useState(true)

  const logout = useCallback(() => {
    clearStoredSession()
    setSession(null)
    setUser(null)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      if (!session?.token) {
        setIsInitializing(false)
        return
      }

      try {
        const currentUser = await authApi.getCurrentUser(session.token)
        if (!cancelled) {
          setUser(normalizeUser(currentUser))
        }
      } catch (error) {
        if (!cancelled && (error instanceof ApiError ? error.status === 401 : true)) {
          logout()
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false)
        }
      }
    }

    restoreSession()

    return () => {
      cancelled = true
    }
  }, [logout, session?.token])

  const login = useCallback(async (usernameOrEmail, password, rememberMe) => {
    const result = await authApi.login(usernameOrEmail, password, rememberMe)
    const nextSession = {
      token: result.token,
      tokenType: result.tokenType,
      expiresIn: result.expiresIn,
      dashboardPath: result.dashboardPath,
    }

    storeSession(nextSession, rememberMe)
    setSession(nextSession)
    const normalizedUser = normalizeUser(result.user)
    setUser(normalizedUser)
    return { ...result, user: normalizedUser }
  }, [])

  const value = useMemo(
    () => ({
      user,
      token: session?.token ?? null,
      isInitializing,
      login,
      logout,
    }),
    [isInitializing, login, logout, session?.token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
