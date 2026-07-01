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
import { getProgressDashboard } from '../api/progressApi.js'
import { getLecturerProgressWorkspace } from '../api/progressWorkspaceApi.js'
import { ApiError } from '../api/httpClient.js'
import { useAuth } from '../auth/useAuth.js'
import DashboardTopbar from '../components/DashboardTopbar.jsx'
import LoadingScreen from '../components/LoadingScreen.jsx'
import '../progress.css'

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

function formatShortDate(value) {
  if (!value) return 'Not scheduled'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getNextCourseCheck(course) {
  const now = Date.now()
  const upcoming = course.assignments
    .flatMap((assignment) => [
      { label: 'Submission', value: assignment.submissionDeadline },
      { label: 'Review', value: assignment.reviewDeadline },
    ])
    .filter((item) => item.value)
    .map((item) => ({ ...item, date: new Date(item.value) }))
    .filter((item) => !Number.isNaN(item.date.getTime()) && item.date.getTime() >= now)
    .sort((first, second) => first.date.getTime() - second.date.getTime())

  return upcoming[0] ?? null
}

function isActiveCourse(course) {
  return String(course.courseStatus ?? '').toUpperCase() === 'ACTIVE'
}

function assignmentNeedsAttention(assignment) {
  const statistics = assignment.progress?.statistics
  if (!statistics) return false

  return statistics.pendingCount > 0
    || statistics.lateCount > 0
    || statistics.incompleteReviews > 0
    || statistics.groupsWithNoReceivedReview > 0
}

function getCourseHealth(course) {
  const monitoredAssignments = course.assignments.filter((assignment) => assignment.progress)
  const attentionCount = course.assignments.filter(assignmentNeedsAttention).length

  if (attentionCount > 0) {
    return {
      label: `${attentionCount} ${attentionCount === 1 ? 'issue' : 'issues'}`,
      tone: 'warning',
    }
  }

  if (monitoredAssignments.length === 0 && course.assignments.length > 0) {
    return {
      label: 'Progress not ready',
      tone: 'neutral',
    }
  }

  return {
    label: 'On track',
    tone: 'positive',
  }
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
        <Icon size={16} aria-hidden="true" />
      </span>
      <div>
        <strong>{value}</strong>
        <p>{label}</p>
        {detail && <small>{detail}</small>}
      </div>
    </article>
  )
}

function DonutChart({ centerLabel, centerValue, segments, title }) {
  const visibleSegments = segments.filter((segment) => segment.value > 0)
  const total = visibleSegments.reduce((sum, segment) => sum + segment.value, 0)
  let cursor = 0
  const gradient = total === 0
    ? '#eef1ed 0 100%'
    : visibleSegments.map((segment) => {
      const start = cursor
      const end = cursor + (segment.value / total) * 100
      cursor = end
      return `${segment.color} ${start}% ${end}%`
    }).join(', ')

  return (
    <article className="progress-donut-card">
      <div>
        <h2>{title}</h2>
      </div>
      <div className="progress-donut-card__body">
        <div
          className="progress-donut"
          style={{ background: `conic-gradient(${gradient})` }}
          aria-label={`${title}: ${centerValue} ${centerLabel}`}
        >
          <span>
            <strong>{centerValue}</strong>
            {centerLabel}
          </span>
        </div>
        <div className="progress-donut-legend">
          {segments.map((segment) => (
            <span key={segment.label}>
              <i style={{ background: segment.color }} />
              <strong>{segment.value}</strong>
              {segment.label}
            </span>
          ))}
        </div>
      </div>
    </article>
  )
}

function CourseOverviewCard({ course, onOpenCourse }) {
  const health = getCourseHealth(course)
  const nextCheck = getNextCourseCheck(course)

  return (
    <article className="progress-course-overview-card">
      <div className="progress-course-card__header">
        <div>
          <p className="eyebrow">{course.classCode}</p>
          <h2>{course.courseName}</h2>
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
        <span className={`progress-course-card__health progress-course-card__health--${health.tone}`}>
          {health.label}
        </span>
      </div>

      <div className="progress-course-card__next-check">
        <CalendarClock size={15} aria-hidden="true" />
        <span>
          {nextCheck
            ? `Next due · ${nextCheck.label} · ${formatShortDate(nextCheck.date)}`
            : 'No upcoming due date'}
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
          Open progress
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
      const monitoredCourses = await Promise.all(
        courseOptions.map(async (course) => {
          const assignments = await Promise.all(
            course.assignments.map(async (assignment) => {
              try {
                const progress = await getProgressDashboard(course.id, assignment.id, token)
                return { ...assignment, progress }
              } catch (progressError) {
                if (progressError instanceof ApiError && progressError.status === 401) {
                  throw progressError
                }
                return {
                  ...assignment,
                  progress: null,
                  progressError: progressError.message || 'Progress unavailable',
                }
              }
            }),
          )

          return { ...course, assignments }
        }),
      )

      setCourses(monitoredCourses)
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
  const activeCourseCount = useMemo(
    () => courses.filter(isActiveCourse).length,
    [courses],
  )
  const attentionAssignmentCount = useMemo(
    () => courses.reduce(
      (total, course) => total + course.assignments.filter(assignmentNeedsAttention).length,
      0,
    ),
    [courses],
  )
  const issueBreakdown = useMemo(() => courses.reduce((totals, course) => {
    course.assignments.forEach((assignment) => {
      const statistics = assignment.progress?.statistics
      if (!statistics) return
      totals.missing += Number(statistics.pendingCount ?? 0)
      totals.incompleteReviews += Number(statistics.incompleteReviews ?? 0)
      totals.noReceivedReview += Number(statistics.groupsWithNoReceivedReview ?? 0)
    })
    return totals
  }, { missing: 0, incompleteReviews: 0, noReceivedReview: 0 }), [courses])
  const overallSubmission = useMemo(() => courses.reduce((totals, course) => {
    course.assignments.forEach((assignment) => {
      const statistics = assignment.progress?.statistics
      if (!statistics) return
      const late = Number(statistics.lateCount ?? 0)
      totals.submitted += Math.max(0, Number(statistics.submittedCount ?? 0) - late)
      totals.notSubmitted += Number(statistics.pendingCount ?? 0)
      totals.late += late
    })
    return totals
  }, { submitted: 0, notSubmitted: 0, late: 0 }), [courses])
  const overallReview = useMemo(() => courses.reduce((totals, course) => {
    course.assignments.forEach((assignment) => {
      const statistics = assignment.progress?.statistics
      if (!statistics) return
      totals.completed += Number(statistics.completedReviews ?? 0)
      totals.incomplete += Number(statistics.incompleteReviews ?? 0)
      totals.noReceivedReview += Number(statistics.groupsWithNoReceivedReview ?? 0)
    })
    return totals
  }, { completed: 0, incomplete: 0, noReceivedReview: 0 }), [courses])
  const totalSubmissionItems = overallSubmission.submitted + overallSubmission.notSubmitted + overallSubmission.late
  const totalReviewItems = overallReview.completed + overallReview.incomplete + overallReview.noReceivedReview
  const totalAttentionItems = issueBreakdown.missing + issueBreakdown.incompleteReviews + issueBreakdown.noReceivedReview

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
            <h1>Monitor Progress</h1>
            <p>Track submissions and peer reviews across your courses.</p>
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
            <p>Your courses will appear here once they are created.</p>
          </section>
        ) : (
          <>
            <section className="progress-chart-grid" aria-label="Monitoring charts">
              <DonutChart
                centerLabel="group tasks"
                centerValue={totalSubmissionItems}
                segments={[
                  { label: 'Submitted', value: overallSubmission.submitted, color: '#3a7d2a' },
                  { label: 'Not submitted', value: overallSubmission.notSubmitted, color: '#d99a2b' },
                  { label: 'Late', value: overallSubmission.late, color: '#c75f4a' },
                ]}
                title="Submission Overview"
              />
              <DonutChart
                centerLabel="items"
                centerValue={totalReviewItems}
                segments={[
                  { label: 'Completed reviews', value: overallReview.completed, color: '#3a7d2a' },
                  { label: 'Incomplete reviews', value: overallReview.incomplete, color: '#2f6f9f' },
                  { label: 'No received review', value: overallReview.noReceivedReview, color: '#c75f4a' },
                ]}
                title="Peer Review Overview"
              />
              <DonutChart
                centerLabel="items"
                centerValue={totalAttentionItems}
                segments={[
                  { label: 'Missing submissions', value: issueBreakdown.missing, color: '#d99a2b' },
                  { label: 'Incomplete reviews', value: issueBreakdown.incompleteReviews, color: '#2f6f9f' },
                  { label: 'No received review', value: issueBreakdown.noReceivedReview, color: '#c75f4a' },
                ]}
                title="Attention Breakdown"
              />
            </section>

            <section className="progress-overview-grid" aria-label="Progress overview">
              <OverviewMetricCard
                icon={BookOpen}
                label="Active Courses"
                value={activeCourseCount}
                detail={`${courses.length} total`}
                tone="green"
              />
              <OverviewMetricCard
                icon={ClipboardList}
                label="Assignments Needing Attention"
                value={attentionAssignmentCount}
                detail={`${assignmentCount} assignments`}
                tone={attentionAssignmentCount > 0 ? 'warning' : 'green'}
              />
              <OverviewMetricCard
                icon={CalendarClock}
                label="Due Soon"
                value={upcomingDeadlineCount}
                detail="next 14 days"
                tone={upcomingDeadlineCount > 0 ? 'warning' : 'green'}
              />
            </section>

            <section className="progress-course-list" aria-label="Courses">
              <div className="monitor-section-heading">
                <div>
                  <h2>Courses</h2>
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
