import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarClock,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getProgressDashboard } from '../api/progressApi.js'
import { getCourseProgressWorkspace } from '../api/progressWorkspaceApi.js'
import { ApiError } from '../api/httpClient.js'
import { useAuth } from '../auth/useAuth.js'
import DashboardTopbar from '../components/DashboardTopbar.jsx'
import LoadingScreen from '../components/LoadingScreen.jsx'
import '../progress.css'

function formatDateTime(value) {
  if (!value) return 'Not scheduled'
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatPercent(value) {
  return `${Number(value ?? 0).toFixed(2)}%`
}

function getNextDeadlineTime(assignment) {
  const now = Date.now()
  const dates = [assignment.submissionDeadline, assignment.reviewDeadline]
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()) && date.getTime() >= now)
    .sort((first, second) => first.getTime() - second.getTime())

  return dates[0]?.getTime() ?? Number.POSITIVE_INFINITY
}

function hasProgressAttention(progress) {
  if (!progress?.statistics) return false
  const statistics = progress.statistics
  return statistics.pendingCount > 0
    || statistics.lateCount > 0
    || statistics.incompleteReviews > 0
    || statistics.groupsWithNoReceivedReview > 0
}

function getAttentionSummary(statistics) {
  const items = []

  if (statistics.pendingCount > 0) {
    items.push(`${statistics.pendingCount} missing submission${statistics.pendingCount === 1 ? '' : 's'}`)
  }
  if (statistics.lateCount > 0) {
    items.push(`${statistics.lateCount} late`)
  }
  if (statistics.groupsWithIncompleteAssignedReviews > 0) {
    items.push(`${statistics.groupsWithIncompleteAssignedReviews} review issue${statistics.groupsWithIncompleteAssignedReviews === 1 ? '' : 's'}`)
  }
  if (statistics.groupsWithNoReceivedReview > 0) {
    items.push(`${statistics.groupsWithNoReceivedReview} no received review`)
  }

  return items
}

function sortAssignmentsForMonitoring(assignments) {
  return [...assignments].sort((first, second) => {
    const firstNeedsAttention = hasProgressAttention(first.progress)
    const secondNeedsAttention = hasProgressAttention(second.progress)

    if (firstNeedsAttention !== secondNeedsAttention) return firstNeedsAttention ? -1 : 1

    return getNextDeadlineTime(first) - getNextDeadlineTime(second)
  })
}

function AccessRestricted() {
  const navigate = useNavigate()

  return (
    <main className="restricted-state">
      <span className="restricted-state__icon">
        <ShieldAlert size={28} aria-hidden="true" />
      </span>
      <p className="eyebrow">Lecturer workspace</p>
      <h1>Access restricted</h1>
      <p>Progress monitoring is available only to lecturers.</p>
      <button className="secondary-action" type="button" onClick={() => navigate('/dashboard')}>
        Back to dashboard
      </button>
    </main>
  )
}

function InlineProgressBar({ label, rate, tone = 'green' }) {
  const safeRate = Math.min(100, Math.max(0, Number(rate ?? 0)))

  return (
    <div className="course-progress-inline-bar">
      <div>
        <span>{label}</span>
        <strong>{formatPercent(safeRate)}</strong>
      </div>
      <div className={`course-progress-inline-bar__track course-progress-inline-bar__track--${tone}`}>
        <span style={{ width: `${safeRate}%` }} />
      </div>
    </div>
  )
}

function CourseAssignmentRow({ assignment, courseId, onOpenProgress }) {
  const progress = assignment.progress
  const statistics = progress?.statistics
  const isUnavailable = !progress
  const attention = hasProgressAttention(progress)
  const attentionItems = statistics ? getAttentionSummary(statistics) : []

  return (
    <article className={`course-assignment-progress-row ${attention ? 'course-assignment-progress-row--attention' : ''}`}>
      <div className="course-assignment-progress-row__main">
        <div>
          <p className="eyebrow">{assignment.lessonTitle}</p>
          <h3>{assignment.title}</h3>
        </div>
        <div className="course-assignment-progress-row__deadlines">
          <span>
            <CalendarClock size={14} aria-hidden="true" />
            Submission: {formatDateTime(assignment.submissionDeadline)}
          </span>
          <span>
            <CalendarClock size={14} aria-hidden="true" />
            Review: {formatDateTime(assignment.reviewDeadline)}
          </span>
        </div>
      </div>

      <div className="course-assignment-progress-row__report">
        {isUnavailable ? (
          <div className="course-progress-unavailable">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{assignment.progressError || 'No progress data available yet.'}</span>
          </div>
        ) : (
          <>
            <InlineProgressBar
              label="Submissions"
              rate={statistics.submissionCompletionRate}
              tone="green"
            />
            <InlineProgressBar
              label="Peer review"
              rate={statistics.peerReviewCompletionRate}
              tone="blue"
            />
            <div className="course-assignment-progress-row__signals">
              <span className={`monitor-badge monitor-badge--${attention ? 'warning' : 'positive'}`}>
                {attention ? 'Needs attention' : 'On track'}
              </span>
              <small>{attentionItems.length > 0 ? attentionItems.join(' · ') : 'No issues found'}</small>
            </div>
          </>
        )}
      </div>

      <button
        className="compact-primary-action"
        type="button"
        onClick={() => onOpenProgress(courseId, assignment.id)}
      >
        View progress
        <ArrowRight size={15} aria-hidden="true" />
      </button>
    </article>
  )
}

function CourseProgressDashboardPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { user, token, logout } = useAuth()
  const isLecturer = user.role === 'LECTURER'
  const [courseWorkspace, setCourseWorkspace] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(isLecturer)
  const [error, setError] = useState('')

  const handleUnauthorized = useCallback((loadError) => {
    if (loadError instanceof ApiError && loadError.status === 401) {
      logout()
      navigate('/login', { replace: true })
      return true
    }
    return false
  }, [logout, navigate])

  const loadCourseDashboard = useCallback(async () => {
    if (!isLecturer) return

    setLoading(true)
    setError('')

    try {
      const workspace = await getCourseProgressWorkspace(courseId, token)
      const progressAssignments = await Promise.all(
        workspace.assignments.map(async (assignment) => {
          try {
            const progress = await getProgressDashboard(courseId, assignment.id, token)
            return { ...assignment, progress }
          } catch (progressError) {
            if (progressError instanceof ApiError && progressError.status === 401) throw progressError
            return {
              ...assignment,
              progress: null,
              progressError: progressError.message || 'No progress data available yet.',
            }
          }
        }),
      )

      setCourseWorkspace(workspace)
      setAssignments(sortAssignmentsForMonitoring(progressAssignments))
    } catch (loadError) {
      if (!handleUnauthorized(loadError)) {
        setError(loadError.message || 'Course progress could not be loaded.')
      }
    } finally {
      setLoading(false)
    }
  }, [courseId, handleUnauthorized, isLecturer, token])

  useEffect(() => {
    const timer = window.setTimeout(loadCourseDashboard, 0)
    return () => window.clearTimeout(timer)
  }, [loadCourseDashboard])

  function openAssignmentProgress(selectedCourseId, assignmentId) {
    navigate(`/lecturer/courses/${selectedCourseId}/assignments/${assignmentId}/progress`)
  }

  const courseMetaItems = courseWorkspace
    ? [
      courseWorkspace.course.classCode,
      courseWorkspace.course.courseStatus,
      `${courseWorkspace.lessons.length} ${courseWorkspace.lessons.length === 1 ? 'lesson' : 'lessons'}`,
      `${assignments.length} ${assignments.length === 1 ? 'assignment' : 'assignments'}`,
      `${courseWorkspace.groupCount ?? 0} ${(courseWorkspace.groupCount ?? 0) === 1 ? 'group' : 'groups'}`,
    ]
    : []

  if (!isLecturer) {
    return (
      <div className="dashboard-shell">
        <DashboardTopbar icon={BarChart3} label="Monitor Progress" />
        <AccessRestricted />
      </div>
    )
  }

  if (loading) return <LoadingScreen label="Loading course progress..." />

  return (
    <div className="dashboard-shell">
      <DashboardTopbar icon={BarChart3} label="Monitor Progress" />

      <main className="monitor-main">
        <button className="back-link" type="button" onClick={() => navigate('/lecturer/progress')}>
          <ArrowLeft size={17} aria-hidden="true" />
          Monitor Progress
        </button>

        {error ? (
          <section className="monitor-page-state monitor-page-state--error">
            <AlertCircle size={28} aria-hidden="true" />
            <h1>Course progress is unavailable</h1>
            <p>{error}</p>
            <button className="secondary-action" type="button" onClick={loadCourseDashboard}>
              <RefreshCw size={17} aria-hidden="true" />
              Retry
            </button>
          </section>
        ) : courseWorkspace ? (
          <>
            <section className="progress-breadcrumb-header">
              <div>
                <p className="progress-breadcrumb">Monitor Progress / {courseWorkspace.course.courseName}</p>
                <h1>{courseWorkspace.course.courseName}</h1>
                <div className="progress-course-meta-chip-row">
                  {courseMetaItems.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
            </section>

            <section className="course-assignment-progress-section" aria-labelledby="course-assignment-progress-heading">
              <div className="monitor-section-heading">
                <div>
                  <h2 id="course-assignment-progress-heading">Assignments</h2>
                </div>
              </div>

              {assignments.length === 0 ? (
                <div className="progress-course-card__empty">
                  No assignments available yet.
                </div>
              ) : (
                <div className="course-assignment-progress-list">
                  {assignments.map((assignment) => (
                    <CourseAssignmentRow
                      assignment={assignment}
                      courseId={courseWorkspace.course.id}
                      key={assignment.id}
                      onOpenProgress={openAssignmentProgress}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  )
}

export default CourseProgressDashboardPage
