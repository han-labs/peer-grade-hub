import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getBackendHealth } from '../api/authApi.js'
import { ApiError } from '../api/httpClient.js'
import { useAuth } from '../auth/useAuth.js'
import BrandMark from '../components/BrandMark.jsx'

const MISSING_CREDENTIALS_MESSAGE =
  'Username and password are required. Please enter your login information.'

const DEMO_ACCOUNTS = [
  { role: 'Student', username: 'student01', password: 'Student@123' },
  { role: 'Lecturer', username: 'lecturer01', password: 'Lecturer@123' },
  { role: 'Administrator', username: 'admin01', password: 'Admin@123' },
]

const ALLOWED_DASHBOARD_PATHS = new Set(['/student', '/lecturer', '/admin'])

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({
    usernameOrEmail: '',
    password: '',
    rememberMe: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [backendStatus, setBackendStatus] = useState('checking')

  useEffect(() => {
    let cancelled = false

    getBackendHealth()
      .then(() => {
        if (!cancelled) setBackendStatus('online')
      })
      .catch(() => {
        if (!cancelled) setBackendStatus('offline')
      })

    return () => {
      cancelled = true
    }
  }, [])

  function updateField(event) {
    const { name, value, checked, type } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setErrorMessage('')
  }

  function fillDemoAccount(account) {
    setForm((current) => ({
      ...current,
      usernameOrEmail: account.username,
      password: account.password,
    }))
    setErrorMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.usernameOrEmail.trim() || !form.password) {
      setErrorMessage(MISSING_CREDENTIALS_MESSAGE)
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const result = await login(
        form.usernameOrEmail.trim(),
        form.password,
        form.rememberMe,
      )
      const destination = ALLOWED_DASHBOARD_PATHS.has(result.dashboardPath)
        ? result.dashboardPath
        : '/dashboard'
      navigate(destination, { replace: true })
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : 'Unable to sign in right now. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-story" aria-labelledby="login-brand-heading">
        <BrandMark />

        <div className="login-story__content">
          <p className="eyebrow">University peer assessment</p>
          <h1 id="login-brand-heading">Clear feedback. Better learning.</h1>
          <p className="login-story__summary">
            One calm workspace for courses, group submissions, peer reviews, and
            published results.
          </p>

          <div className="workflow-visual" aria-label="Peer assessment workflow">
            <div className="workflow-step">
              <span className="workflow-step__icon workflow-step__icon--blue">
                <BookOpen size={20} />
              </span>
              <div>
                <strong>Prepare</strong>
                <span>Courses and assignments</span>
              </div>
              <CheckCircle2 size={18} aria-hidden="true" />
            </div>
            <div className="workflow-step">
              <span className="workflow-step__icon workflow-step__icon--green">
                <UsersRound size={20} />
              </span>
              <div>
                <strong>Collaborate</strong>
                <span>Groups and peer reviews</span>
              </div>
              <ArrowRight size={18} aria-hidden="true" />
            </div>
            <div className="workflow-step">
              <span className="workflow-step__icon workflow-step__icon--yellow">
                <BadgeCheck size={20} />
              </span>
              <div>
                <strong>Progress</strong>
                <span>Feedback and results</span>
              </div>
              <ArrowRight size={18} aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="connection-status" data-status={backendStatus}>
          <span className="connection-status__dot" aria-hidden="true" />
          <span>
            {backendStatus === 'online'
              ? 'Backend connected'
              : backendStatus === 'offline'
                ? 'Backend unavailable'
                : 'Checking backend'}
          </span>
        </div>
      </section>

      <section className="login-panel" aria-labelledby="login-heading">
        <div className="login-card">
          <div className="login-card__heading">
            <span className="secure-icon" aria-hidden="true">
              <ShieldCheck size={22} />
            </span>
            <div>
              <p className="eyebrow">Welcome back</p>
              <h2 id="login-heading">Sign in to your workspace</h2>
            </div>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {errorMessage && (
              <div className="form-alert" role="alert">
                <AlertCircle size={19} aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            <label className="form-field">
              <span>Username or email</span>
              <input
                autoComplete="username"
                name="usernameOrEmail"
                onChange={updateField}
                placeholder="Enter your username or email"
                value={form.usernameOrEmail}
              />
            </label>

            <label className="form-field">
              <span>Password</span>
              <span className="password-input">
                <input
                  autoComplete="current-password"
                  name="password"
                  onChange={updateField}
                  placeholder="Enter your password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                />
                <button
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="icon-button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  type="button"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </span>
            </label>

            <label className="remember-control">
              <input
                checked={form.rememberMe}
                name="rememberMe"
                onChange={updateField}
                type="checkbox"
              />
              <span>
                <strong>Remember me</strong>
                <small>Keep this account signed in on this device.</small>
              </span>
            </label>

            <button className="primary-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <span className="button-spinner" aria-hidden="true" />
                  Signing in
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={19} aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <div className="demo-accounts">
            <div className="demo-accounts__heading">
              <div>
                <h3>Demo accounts</h3>
                <p>Select an account to fill the form.</p>
              </div>
              <LockKeyhole size={19} aria-hidden="true" />
            </div>

            <div className="demo-account-list">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  className="demo-account"
                  key={account.role}
                  onClick={() => fillDemoAccount(account)}
                  type="button"
                >
                  <span className={`demo-account__avatar role-${account.role.toLowerCase()}`}>
                    {account.role.charAt(0)}
                  </span>
                  <span>
                    <strong>{account.role}</strong>
                    <small>{account.username}</small>
                  </span>
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default LoginPage
