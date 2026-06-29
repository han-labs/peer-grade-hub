import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarClock,
  ClipboardList,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
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

function isFutureDate(value) {
  if (!value) return false
  return new Date(value).getTime() >= Date.now()
}

function hasProgressAttention(progress) {
  if (!progress?.statistics) return false
  const statistics = progress.statistics
  return statistics.pendingCount > 0
    || statistics.lateCount > 0
    || statistics.incompleteReviews > 0
    || statistics.groupsWithNoReceivedReview > 0
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
      <p>Course progress dashboards are available only to lecturers.</p>
      <button className="secondary-action" type="button" onClick={() => navigate('/dashboard')}>
        Back to dashboard
      </button>
    </main>
  )
}

function CourseSummaryCard({ icon: Icon, label, value, detail, tone = 'neutral' }) {
  return (
    <article className={`progress-overview-metric progress-overview-metric--${tone}`}>
      <span>
        <Icon size={18} aria-hidden="true" />
      </span>
      <div>
        <strong>{value}</strong>
        <p>{label}</p>
        {detail && <small>{detail}</small>}
      </div>
    </article>
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

  return (
    <article className={`course-assignment-progress-row ${attention ? 'course-assignment-progress-row--attention' : ''}`}>
      <div className="course-assignment-progress-row__main">
        <div>
          <p className="eyebrow">{assignment.lessonTitle}</p>
          <h3>{assignment.title}</h3>
          {assignment.description && <p>{assignment.description}</p>}
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
              label="Submission"
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
              <small>
                {statistics.pendingCount} pending · {statistics.lateCount} late · {statistics.incompleteReviews} unfinished reviews
              </small>
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
      setAssignments(progressAssignments)
    } catch (loadError) {
      if (!handleUnauthorized(loadError)) {
        setError(loadError.message || 'Course progress dashboard could not be loaded.')
      }
    } finally {
      setLoading(false)
    }
  }, [courseId, handleUnauthorized, isLecturer, token])

  useEffect(() => {
    const timer = window.setTimeout(loadCourseDashboard, 0)
    return () => window.clearTimeout(timer)
  }, [loadCourseDashboard])

  const summary = useMemo(() => {
    const assignmentsWithProgress = assignments.filter((assignment) => assignment.progress)
    const attentionCount = assignmentsWithProgress.filter((assignment) => hasProgressAttention(assignment.progress)).length
    const openForSubmission = assignments.filter((assignment) => isFutureDate(assignment.submissionDeadline)).length
    const reviewInProgress = assignmentsWithProgress.filter((assignment) => (
      assignment.progress.statistics.totalReviewAssignments > 0
      && assignment.progress.statistics.incompleteReviews > 0
    )).length

    return {
      attentionCount,
      openForSubmission,
      reviewInProgress,
      assignmentsWithProgress: assignmentsWithProgress.length,
    }
  }, [assignments])

  function openAssignmentProgress(selectedCourseId, assignmentId) {
    navigate(`/lecturer/courses/${selectedCourseId}/assignments/${assignmentId}/progress`)
  }

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
            <section className="progress-course-dashboard-hero">
              <div>
                <p className="eyebrow">Course progress dashboard</p>
                <h1>{courseWorkspace.course.courseName}</h1>
                <p>{courseWorkspace.course.description || 'Review assignment progress for this course.'}</p>
              </div>
              <div className="progress-course-dashboard-hero__facts">
                <span>
                  <strong>{courseWorkspace.course.classCode}</strong>
                  class code
                </span>
                <span>
                  <strong>{courseWorkspace.course.courseStatus}</strong>
                  status
                </span>
                <span>
                  <strong>{courseWorkspace.lessons.length}</strong>
                  lessons
                </span>
                <span>
                  <strong>{assignments.length}</strong>
                  assignments
                </span>
              </div>
            </section>

            <section className="progress-overview-grid" aria-label="Course progress summary">
              <CourseSummaryCard
                icon={ClipboardList}
                label="Assignments"
                value={assignments.length}
                detail={`${summary.assignmentsWithProgress} with progress data`}
                tone="blue"
              />
              <CourseSummaryCard
                icon={CalendarClock}
                label="Open for submission"
                value={summary.openForSubmission}
                detail="based on submission deadlines"
                tone={summary.openForSubmission > 0 ? 'green' : 'neutral'}
              />
              <CourseSummaryCard
                icon={TrendingUp}
                label="Review in progress"
                value={summary.reviewInProgress}
                detail="assignments with unfinished review tasks"
                tone={summary.reviewInProgress > 0 ? 'warning' : 'green'}
              />
              <CourseSummaryCard
                icon={AlertCircle}
                label="Needs attention"
                value={summary.attentionCount}
                detail="assignments with pending, late, or review issues"
                tone={summary.attentionCount > 0 ? 'warning' : 'green'}
              />
            </section>

            <section className="course-assignment-progress-section" aria-labelledby="course-assignment-progress-heading">
              <div className="monitor-section-heading">
                <div>
                  <p className="eyebrow">Assignment report</p>
                  <h2 id="course-assignment-progress-heading">Progress by assignment</h2>
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
