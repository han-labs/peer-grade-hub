import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarClock,
  ClipboardList,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLecturerProgressWorkspace } from '../api/progressWorkspaceApi.js'
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

function getNearestDeadline(assignments) {
  const now = Date.now()
  const dates = assignments
    .flatMap((assignment) => [assignment.submissionDeadline, assignment.reviewDeadline])
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()) && date.getTime() >= now)
    .sort((first, second) => first.getTime() - second.getTime())

  return dates[0] ?? null
}

function countUpcomingDeadlines(courses) {
  const now = Date.now()
  const twoWeeks = 14 * 24 * 60 * 60 * 1000

  return courses.reduce((total, course) => (
    total + course.assignments.filter((assignment) => {
      const deadlines = [assignment.submissionDeadline, assignment.reviewDeadline]
      return deadlines.some((value) => {
        if (!value) return false
        const deadlineTime = new Date(value).getTime()
        return deadlineTime >= now && deadlineTime <= now + twoWeeks
      })
    }).length
  ), 0)
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

function AssignmentsByCourseChart({ courses }) {
  const maxAssignments = Math.max(1, ...courses.map((course) => course.assignments.length))

  return (
    <section className="progress-overview-chart" aria-labelledby="assignments-by-course-heading">
      <div className="monitor-section-heading">
        <div>
          <p className="eyebrow">Course workload</p>
          <h2 id="assignments-by-course-heading">Assignments by course</h2>
        </div>
      </div>
      <div className="progress-course-bars">
        {courses.map((course) => {
          const width = `${Math.max(5, (course.assignments.length / maxAssignments) * 100)}%`
          return (
            <div className="progress-course-bar" key={course.id}>
              <div>
                <strong>{course.courseName}</strong>
                <span>{course.classCode}</span>
              </div>
              <div className="progress-course-bar__track" aria-hidden="true">
                <span style={{ width }} />
              </div>
              <small>{course.assignments.length}</small>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function CourseOverviewCard({ course, onOpenCourse }) {
  const nearestDeadline = getNearestDeadline(course.assignments)

  return (
    <article className="progress-course-overview-card">
      <div className="progress-course-card__header">
        <div>
          <p className="eyebrow">{course.classCode}</p>
          <h2>{course.courseName}</h2>
          {course.description && <p>{course.description}</p>}
        </div>
        <span className="monitor-badge monitor-badge--active">{course.courseStatus}</span>
      </div>

      <div className="progress-course-card__meta">
        <span>
          <BookOpen size={15} aria-hidden="true" />
          {course.lessons.length} {course.lessons.length === 1 ? 'lesson' : 'lessons'}
        </span>
        <span>
          <ClipboardList size={15} aria-hidden="true" />
          {course.assignments.length} {course.assignments.length === 1 ? 'assignment' : 'assignments'}
        </span>
        <span>
          <CalendarClock size={15} aria-hidden="true" />
          Nearest: {formatDateTime(nearestDeadline)}
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
          Open course dashboard
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      )}
    </article>
  )
}

function ProgressLandingPage() {
  const navigate = useNavigate()
  const { user, token, logout } = useAuth()
  const isLecturer = user.role === 'LECTURER'
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(isLecturer)
  const [error, setError] = useState('')

  const loadProgressOverview = useCallback(async () => {
    if (!isLecturer) return

    setLoading(true)
    setError('')

    try {
      const courseOptions = await getLecturerProgressWorkspace(token)
      setCourses(courseOptions)
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 401) {
        logout()
        navigate('/login', { replace: true })
        return
      }
      setError(loadError.message || 'Progress overview could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [isLecturer, logout, navigate, token])

  useEffect(() => {
    const timer = window.setTimeout(loadProgressOverview, 0)
    return () => window.clearTimeout(timer)
  }, [loadProgressOverview])

  const assignmentCount = useMemo(
    () => courses.reduce((total, course) => total + course.assignments.length, 0),
    [courses],
  )
  const upcomingDeadlineCount = useMemo(() => countUpcomingDeadlines(courses), [courses])

  if (!isLecturer) {
    return (
      <div className="dashboard-shell">
        <DashboardTopbar icon={BarChart3} label="Monitor Progress" />
        <AccessRestricted />
      </div>
    )
  }

  if (loading) return <LoadingScreen label="Loading progress workspace..." />

  return (
    <div className="dashboard-shell">
      <DashboardTopbar icon={BarChart3} label="Monitor Progress" />

      <main className="monitor-main">
        <section className="progress-landing-hero">
          <div>
            <p className="eyebrow">Assessment monitoring</p>
            <h1>Monitor Progress</h1>
            <p>Track submission and peer review progress across your courses.</p>
          </div>
        </section>

        {error ? (
          <section className="monitor-page-state monitor-page-state--error">
            <AlertCircle size={28} aria-hidden="true" />
            <h1>Progress overview is unavailable</h1>
            <p>{error}</p>
            <button className="secondary-action" type="button" onClick={loadProgressOverview}>
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
            <section className="progress-overview-grid" aria-label="Progress overview">
              <OverviewMetricCard
                icon={BookOpen}
                label="Courses"
                value={courses.length}
                detail="available to monitor"
                tone="green"
              />
              <OverviewMetricCard
                icon={ClipboardList}
                label="Assignments"
                value={assignmentCount}
                detail="found across courses"
                tone="blue"
              />
              <OverviewMetricCard
                icon={CalendarClock}
                label="Upcoming Deadlines"
                value={upcomingDeadlineCount}
                detail="within the next 14 days"
                tone={upcomingDeadlineCount > 0 ? 'warning' : 'green'}
              />
              <OverviewMetricCard
                icon={BarChart3}
                label="Attention Review"
                value="Per course"
                detail="open a course dashboard for assignment-level signals"
                tone="neutral"
              />
            </section>

            <AssignmentsByCourseChart courses={courses} />

            <section className="progress-course-list" aria-label="Courses">
              <div className="monitor-section-heading">
                <div>
                  <p className="eyebrow">Course dashboards</p>
                  <h2>Choose a course to inspect</h2>
                </div>
              </div>
              {courses.map((course) => (
                <CourseOverviewCard
                  course={course}
                  key={course.id}
                  onOpenCourse={(courseId) => navigate(`/lecturer/progress/courses/${courseId}`)}
                />
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default ProgressLandingPage
