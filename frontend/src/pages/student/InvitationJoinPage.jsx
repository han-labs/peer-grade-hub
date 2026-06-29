import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, BookOpen, CheckCircle2, Link as LinkIcon, UsersRound } from 'lucide-react'
import { useAuth } from '../../auth/useAuth.js'
import { ApiError } from '../../api/httpClient.js'
import { joinCourse, previewInvitation } from '../../api/studentParticipationApi.js'
import DashboardTopbar from '../../components/DashboardTopbar.jsx'
import LoadingScreen from '../../components/LoadingScreen.jsx'

export default function InvitationJoinPage() {
  const { invitationCode } = useParams()
  const navigate = useNavigate()
  const { token, logout } = useAuth()
  const [manualCode, setManualCode] = useState('')
  const [manualError, setManualError] = useState('')
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let mounted = true

    if (!invitationCode) {
      setPreview(null)
      setError('')
      setLoading(false)
      return () => {
        mounted = false
      }
    }

    setLoading(true)
    setError('')

    previewInvitation(invitationCode, token)
      .then((response) => {
        if (!mounted) return
        setPreview(response.data)
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout()
          navigate('/login', { replace: true })
          return
        }
        if (mounted) setError(err.message || 'Invitation could not be loaded.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [invitationCode, token, logout, navigate])

  const handleManualSubmit = (event) => {
    event.preventDefault()
    const trimmedCode = manualCode.trim()

    if (!trimmedCode) {
      setManualError('Please enter an invitation code.')
      return
    }

    setManualError('')
    navigate(`/join/${encodeURIComponent(trimmedCode)}`)
  }

  const handleJoin = () => {
    setJoining(true)
    setError('')
    setNotice('')

    joinCourse(invitationCode, token)
      .then((response) => {
        const data = response.data
        setNotice(data?.message || response.message || 'Course joined successfully.')
        navigate(`/student/courses/${data.courseId}/groups`)
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout()
          navigate('/login', { replace: true })
          return
        }
        setError(err.message || 'Course could not be joined.')
      })
      .finally(() => setJoining(false))
  }

  if (loading) return <LoadingScreen label="Loading invitation..." />

  return (
    <div className="dashboard-shell">
      <DashboardTopbar icon={BookOpen} label="Join Course / Group" />

      <main className="dashboard-main student-participation-page">
        <div className="student-participation-header">
          <p className="eyebrow">Invitation</p>
          <h1>{invitationCode ? preview?.courseName || 'Course invitation' : 'Join Course'}</h1>
          <p>
            {invitationCode
              ? preview?.classCode || invitationCode
              : 'Enter the invitation code provided by your lecturer.'}
          </p>
        </div>

        {!invitationCode && (
          <section className="invitation-panel invitation-panel--manual">
            <div className="invitation-panel__main">
              <div className="invitation-panel__icon">
                <LinkIcon size={22} />
              </div>
              <div>
                <span className="status-badge status-badge--active">COURSE ACCESS</span>
                <h2>Check an invitation</h2>
                <p>Paste the course invitation code exactly as your lecturer shared it.</p>
              </div>
            </div>

            <form className="invitation-code-form" onSubmit={handleManualSubmit} noValidate>
              <label className="invitation-code-field">
                <span>Invitation code</span>
                <input
                  autoComplete="off"
                  onChange={(event) => {
                    setManualCode(event.target.value)
                    setManualError('')
                  }}
                  placeholder="PGH-TEST01"
                  value={manualCode}
                />
              </label>
              {manualError && <p className="field-error">{manualError}</p>}
              <button className="compact-primary-action" type="submit">
                Check Invitation
                <ArrowRight size={16} />
              </button>
            </form>
          </section>
        )}

        {error && (
          <div className="error-state">
            <p>{error}</p>
            <button className="secondary-action" type="button" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        )}

        {invitationCode && !error && preview && (
          <section className="invitation-panel">
            <div className="invitation-panel__main">
              <div className="invitation-panel__icon">
                <LinkIcon size={22} />
              </div>
              <div>
                <span className="status-badge status-badge--active">ACTIVE</span>
                <h2>{preview.courseName}</h2>
                {preview.description && <p>{preview.description}</p>}
              </div>
            </div>

            <div className="invitation-detail-grid">
              <span>
                <small>Class Code</small>
                <strong>{preview.classCode || '-'}</strong>
              </span>
              <span>
                <small>Lecturer</small>
                <strong>{preview.lecturerName || '-'}</strong>
              </span>
              <span>
                <small>Invitation Code</small>
                <strong>{preview.invitationCode || invitationCode}</strong>
              </span>
            </div>

            {notice && <p className="success-message">{notice}</p>}

            <div className="student-action-row">
              {preview.alreadyJoined ? (
                <>
                  <p className="inline-status">
                    <CheckCircle2 size={17} />
                    You already joined this course.
                  </p>
                  <button
                    className="compact-primary-action"
                    type="button"
                    onClick={() => navigate(`/student/courses/${preview.courseId}/groups`)}
                  >
                    <UsersRound size={16} />
                    Choose Group
                  </button>
                </>
              ) : (
                <button
                  className="compact-primary-action"
                  type="button"
                  disabled={joining}
                  onClick={handleJoin}
                >
                  {joining ? 'Joining...' : 'Confirm Join'}
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
