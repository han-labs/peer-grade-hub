import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  RefreshCw,
  ShieldAlert,
  UsersRound,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAssignPeerReviewWorkspace } from '../api/peerReviewAssignmentWorkspaceApi.js'
import { ApiError } from '../api/httpClient.js'
import { useAuth } from '../auth/useAuth.js'
import DashboardTopbar from '../components/DashboardTopbar.jsx'
import LoadingScreen from '../components/LoadingScreen.jsx'
import '../progress.css'

function AccessRestricted() {
  const navigate = useNavigate()

  return (
    <main className="restricted-state">
      <span className="restricted-state__icon">
        <ShieldAlert size={28} aria-hidden="true" />
      </span>
      <p className="eyebrow">Lecturer workspace</p>
      <h1>Access restricted</h1>
      <p>Peer review assignment setup is available only to lecturers.</p>
      <button className="secondary-action" type="button" onClick={() => navigate('/dashboard')}>
        Back to dashboard
      </button>
    </main>
  )
}

function OverviewMetricCard({ icon: Icon, label, value, detail, tone = 'neutral' }) {
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

function CourseReviewSetupCard({ course, onOpenCourse }) {
  const groupsNeedReviewers = course.groupsWithoutReviewersCount ?? 0

  return (
    <article className="progress-course-overview-card peer-setup-course-card">
      <div className="progress-course-card__header">
        <div>
          <p className="eyebrow">{course.classCode}</p>
          <h2>{course.courseName}</h2>
        </div>
        <span className="monitor-badge monitor-badge--active">{course.courseStatus}</span>
      </div>

      <div className="progress-course-card__meta">
        <span>
          <ClipboardCheck size={15} aria-hidden="true" />
          {course.assignmentCount} {course.assignmentCount === 1 ? 'assignment' : 'assignments'}
        </span>
        <span>
          <UsersRound size={15} aria-hidden="true" />
          {course.groupCount} {course.groupCount === 1 ? 'group' : 'groups'}
        </span>
        <span>
          <CalendarClock size={15} aria-hidden="true" />
          {course.openReviewAssignmentCount} open
        </span>
        <span className={groupsNeedReviewers > 0 ? 'peer-setup-chip--warning' : 'peer-setup-chip--positive'}>
          <AlertCircle size={15} aria-hidden="true" />
          {groupsNeedReviewers > 0
            ? `${groupsNeedReviewers} ${groupsNeedReviewers === 1 ? 'need reviewers' : 'need reviewers'}`
            : 'All groups covered'}
        </span>
      </div>

      {course.error ? (
        <div className="progress-course-card__error">
          <AlertCircle size={17} aria-hidden="true" />
          <span>{course.error}</span>
        </div>
      ) : (
        <button
          className="progress-course-open-button"
          type="button"
          onClick={() => onOpenCourse(course.id)}
        >
          Open setup
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      )}
    </article>
  )
}

function AssignPeerReviewLandingPage() {
  const navigate = useNavigate()
  const { user, token, logout } = useAuth()
  const isLecturer = user.role === 'LECTURER'
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(isLecturer)
  const [error, setError] = useState('')

  const loadWorkspace = useCallback(async () => {
    if (!isLecturer) return

    setLoading(true)
    setError('')

    try {
      const courseOptions = await getAssignPeerReviewWorkspace(token)
      setCourses(courseOptions)
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 401) {
        logout()
        navigate('/login', { replace: true })
        return
      }
      setError(loadError.message || 'Peer review assignment workspace could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [isLecturer, logout, navigate, token])

  useEffect(() => {
    const timer = window.setTimeout(loadWorkspace, 0)
    return () => window.clearTimeout(timer)
  }, [loadWorkspace])

  const summary = useMemo(() => ({
    courseCount: courses.length,
    openReviewAssignmentCount: courses.reduce(
      (total, course) => total + course.openReviewAssignmentCount,
      0,
    ),
    groupsWithoutReviewersCount: courses.reduce(
      (total, course) => total + (course.groupsWithoutReviewersCount ?? 0),
      0,
    ),
  }), [courses])

  if (!isLecturer) {
    return (
      <div className="dashboard-shell">
        <DashboardTopbar icon={ClipboardCheck} label="Assign Peer Review" />
        <AccessRestricted />
      </div>
    )
  }

  if (loading) return <LoadingScreen label="Loading peer review setup..." />

  return (
    <div className="dashboard-shell">
      <DashboardTopbar icon={ClipboardCheck} label="Assign Peer Review" />

      <main className="monitor-main">
        <section className="progress-landing-hero">
          <div>
            <h1>Assign Peer Review</h1>
            <p>Choose a course and assignment to set up group reviews.</p>
          </div>
        </section>

        {error ? (
          <section className="monitor-page-state monitor-page-state--error">
            <AlertCircle size={28} aria-hidden="true" />
            <h1>Peer review setup is unavailable</h1>
            <p>{error}</p>
            <button className="secondary-action" type="button" onClick={loadWorkspace}>
              <RefreshCw size={17} aria-hidden="true" />
              Retry
            </button>
          </section>
        ) : courses.length === 0 ? (
          <section className="monitor-page-state">
            <BookOpen size={28} aria-hidden="true" />
            <h1>No courses available</h1>
            <p>Courses assigned to you will appear here once they are created.</p>
          </section>
        ) : (
          <>
            <section className="progress-overview-grid" aria-label="Peer review setup overview">
              <OverviewMetricCard
                icon={BookOpen}
                label="Courses"
                value={summary.courseCount}
                detail="available for setup"
                tone="green"
              />
              <OverviewMetricCard
                icon={ClipboardCheck}
                label="Assignments Open for Setup"
                value={summary.openReviewAssignmentCount}
                detail="review deadline still open"
                tone="blue"
              />
              <OverviewMetricCard
                icon={AlertCircle}
                label="Groups Without Reviewers"
                value={summary.groupsWithoutReviewersCount}
                detail="still need an incoming review"
                tone={summary.groupsWithoutReviewersCount > 0 ? 'warning' : 'green'}
              />
            </section>

            <section className="progress-course-list" aria-label="Courses">
              <div className="monitor-section-heading">
                <div>
                  <h2>Courses</h2>
                </div>
              </div>
              {courses.map((course) => (
                <CourseReviewSetupCard
                  course={course}
                  key={course.id}
                  onOpenCourse={(courseId) => navigate(`/lecturer/peer-review-assignments/courses/${courseId}`)}
                />
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default AssignPeerReviewLandingPage
