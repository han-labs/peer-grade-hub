import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  ClipboardCheck,
  RefreshCw,
  ShieldAlert,
  UsersRound,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAssignPeerReviewCourseWorkspace } from '../api/peerReviewAssignmentWorkspaceApi.js'
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

function getNextDeadlineTime(assignment) {
  const now = Date.now()
  const dates = [assignment.reviewDeadline, assignment.submissionDeadline]
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()) && date.getTime() >= now)
    .sort((first, second) => first.getTime() - second.getTime())

  return dates[0]?.getTime() ?? Number.POSITIVE_INFINITY
}

function sortAssignmentsForSetup(assignments) {
  return [...assignments].sort((first, second) => {
    const firstNeedsReviewers = first.groupsWithoutReceivedReviewCount > 0
    const secondNeedsReviewers = second.groupsWithoutReceivedReviewCount > 0

    if (firstNeedsReviewers !== secondNeedsReviewers) return firstNeedsReviewers ? -1 : 1
    if (first.reviewDeadlineOpen !== second.reviewDeadlineOpen) return first.reviewDeadlineOpen ? -1 : 1

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
      <p>Course peer review setup is available only to lecturers.</p>
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

function AssignmentSetupRow({ assignment, onOpenAssignment }) {
  const needsReviewers = assignment.groupsWithoutReceivedReviewCount > 0
  const canAssign = assignment.reviewDeadlineOpen && assignment.readyForAssignment
  const pairLabel = `${assignment.existingPeerReviewAssignmentCount} ${assignment.existingPeerReviewAssignmentCount === 1 ? 'pair' : 'pairs'} created`
  const needReviewerLabel = assignment.groupsWithoutReceivedReviewCount > 0
    ? `${assignment.groupsWithoutReceivedReviewCount} ${assignment.groupsWithoutReceivedReviewCount === 1 ? 'needs' : 'need'} reviewers`
    : 'All groups covered'

  return (
    <article className={`course-assignment-progress-row peer-setup-assignment-row ${needsReviewers ? 'course-assignment-progress-row--attention' : ''}`}>
      <div className="course-assignment-progress-row__main">
        <p className="eyebrow">{assignment.lessonTitle}</p>
        <h3>{assignment.title}</h3>
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
        {assignment.readinessError ? (
          <div className="course-progress-unavailable">
            <AlertCircle size={16} aria-hidden="true" />
            {assignment.readinessError}
          </div>
        ) : (
          <>
            <div className="course-assignment-progress-row__signals">
              <span className={`deadline-badge deadline-badge--${assignment.reviewDeadlineOpen ? 'open' : 'closed'}`}>
                {assignment.reviewDeadlineOpen ? 'Open for setup' : 'Setup closed'}
              </span>
              <small>{assignment.groupCount} {assignment.groupCount === 1 ? 'group' : 'groups'}</small>
              <small>{pairLabel}</small>
              <small>{needReviewerLabel}</small>
            </div>
          </>
        )}
      </div>

      <button
        className="progress-course-open-button"
        type="button"
        onClick={() => onOpenAssignment(assignment.id)}
      >
        {canAssign ? 'Assign reviews' : 'Open setup'}
        <ArrowRight size={15} aria-hidden="true" />
      </button>
    </article>
  )
}

function AssignPeerReviewCoursePage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { user, token, logout } = useAuth()
  const isLecturer = user.role === 'LECTURER'
  const [workspace, setWorkspace] = useState(null)
  const [loading, setLoading] = useState(isLecturer)
  const [error, setError] = useState('')

  const loadCourseWorkspace = useCallback(async () => {
    if (!isLecturer) return

    setLoading(true)
    setError('')

    try {
      const data = await getAssignPeerReviewCourseWorkspace(courseId, token)
      setWorkspace({
        ...data,
        assignments: sortAssignmentsForSetup(data.assignments ?? []),
      })
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 401) {
        logout()
        navigate('/login', { replace: true })
        return
      }
      setError(loadError.message || 'Course peer review setup could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [courseId, isLecturer, logout, navigate, token])

  useEffect(() => {
    const timer = window.setTimeout(loadCourseWorkspace, 0)
    return () => window.clearTimeout(timer)
  }, [loadCourseWorkspace])

  const summary = useMemo(() => {
    const assignments = workspace?.assignments ?? []
    return {
      assignmentCount: assignments.length,
      groupCount: workspace?.groupCount ?? 0,
      groupsWithoutReviewersCount: assignments.reduce(
        (total, assignment) => total + assignment.groupsWithoutReceivedReviewCount,
        0,
      ),
    }
  }, [workspace])

  const courseMetaItems = workspace
    ? [
      workspace.course.classCode,
      workspace.course.courseStatus,
      `${workspace.lessons.length} ${workspace.lessons.length === 1 ? 'lesson' : 'lessons'}`,
    ]
    : []

  if (!isLecturer) {
    return (
      <div className="dashboard-shell">
        <DashboardTopbar icon={ClipboardCheck} label="Assign Peer Review" />
        <AccessRestricted />
      </div>
    )
  }

  if (loading) return <LoadingScreen label="Loading course peer review setup..." />

  return (
    <div className="dashboard-shell">
      <DashboardTopbar icon={ClipboardCheck} label="Assign Peer Review" />

      <main className="monitor-main">
        <button className="back-link" type="button" onClick={() => navigate('/lecturer/peer-review-assignments')}>
          <ArrowLeft size={17} aria-hidden="true" />
          Assign Peer Review
        </button>

        {error ? (
          <section className="monitor-page-state monitor-page-state--error">
            <AlertCircle size={28} aria-hidden="true" />
            <h1>Course setup is unavailable</h1>
            <p>{error}</p>
            <button className="secondary-action" type="button" onClick={loadCourseWorkspace}>
              <RefreshCw size={17} aria-hidden="true" />
              Retry
            </button>
          </section>
        ) : workspace ? (
          <>
            <section className="progress-breadcrumb-header peer-setup-course-header">
              <div>
                <p className="progress-breadcrumb">Assign Peer Review / {workspace.course.courseName}</p>
                <h1>{workspace.course.courseName}</h1>
                <div className="progress-course-meta-chip-row">
                  {courseMetaItems.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
            </section>

            <section className="progress-overview-grid" aria-label="Course peer review setup summary">
              <CourseSummaryCard
                icon={UsersRound}
                label="Groups"
                value={summary.groupCount}
                detail="available for pairing"
                tone="green"
              />
              <CourseSummaryCard
                icon={ClipboardCheck}
                label="Assignments"
                value={summary.assignmentCount}
                detail="available in this course"
                tone="blue"
              />
              <CourseSummaryCard
                icon={AlertCircle}
                label="Need Reviewers"
                value={summary.groupsWithoutReviewersCount}
                detail="groups without incoming review"
                tone={summary.groupsWithoutReviewersCount > 0 ? 'warning' : 'green'}
              />
            </section>

            <section className="course-assignment-progress-section" aria-labelledby="peer-review-assignment-list-heading">
              <div className="monitor-section-heading">
                <div>
                  <h2 id="peer-review-assignment-list-heading">Assignments</h2>
                </div>
              </div>

              {workspace.assignments.length === 0 ? (
                <div className="progress-course-card__empty">
                  No assignments available yet.
                </div>
              ) : (
                <div className="course-assignment-progress-list">
                  {workspace.assignments.map((assignment) => (
                    <AssignmentSetupRow
                      assignment={assignment}
                      key={assignment.id}
                      onOpenAssignment={(assignmentId) => navigate(`/lecturer/assignments/${assignmentId}/peer-review-assignments`)}
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

export default AssignPeerReviewCoursePage
