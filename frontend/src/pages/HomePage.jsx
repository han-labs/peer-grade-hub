import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRoleDashboard } from '../api/dashboardApi.js'
import { ApiError } from '../api/httpClient.js'
import { useAuth } from '../auth/useAuth.js'
import DashboardTopbar from '../components/DashboardTopbar.jsx'

const ROLE_CONTENT = {
  STUDENT: {
    label: 'Student',
    accent: 'student',
<<<<<<< HEAD
    heading: 'Learning workspace',
    description: 'Keep courses, group work, peer reviews, and published results organized.',
    stats: [],
    sections: [
      {
        title: 'Study tasks',
        eyebrow: 'What to do next',
        description: 'Open the workspaces available for your current learning flow.',
        features: [
          {
            title: 'Submit Peer Review',
            description: 'Open your assigned review task, inspect the submission, then submit score and feedback.',
            status: 'Available',
            meta: 'Peer review task',
            action: 'Submit Review',
            path: '/peer-reviews/tasks/1',
            icon: ClipboardCheck,
            tone: 'blue',
          },
          {
            title: 'Join Course / Group',
            description: 'Join a course with an invitation code and participate in group formation.',
            status: 'Planned',
            meta: 'Course enrollment',
            action: 'Not available',
            path: null,
            icon: UsersRound,
            tone: 'green',
          },
          {
            title: 'Submit Assignment',
            description: 'Upload group submissions and supporting materials once the submission flow is connected.',
            status: 'Planned',
            meta: 'Assignment submission',
            action: 'Not available',
            path: null,
            icon: FileText,
            tone: 'yellow',
          },
          {
            title: 'View Results',
            description: 'Review published final scores and feedback after lecturers release results.',
            status: 'Planned',
            meta: 'Published grades',
            action: 'Not available',
            path: null,
            icon: Gauge,
            tone: 'purple',
          },
        ],
      },
=======
    heading: 'Your learning workspace',
    description: 'Keep course work and peer review responsibilities in view.',
    stats: [
      { label: 'Enrolled courses', value: '—', hint: 'Course workspace', icon: BookOpen },
      { label: 'Pending reviews', value: '—', hint: 'Review queue', icon: ClipboardCheck },
      { label: 'Account status', value: 'Active', hint: 'Ready to participate', icon: CheckCircle2 },
    ],
    focus: [
      { title: 'Joined courses', detail: 'Course enrollment summary', icon: BookOpen },
      { title: 'Peer review tasks', detail: 'Assigned review queue', icon: UsersRound, path: '/peer-reviews' },
>>>>>>> 5abb507 (fix: Update UC07 peer review backend and frontend implementation)
    ],
  },
  LECTURER: {
    label: 'Lecturer',
    accent: 'lecturer',
    heading: 'Teaching workspace',
    description: 'Manage courses, groups, assignments, peer reviews, progress, and final grades.',
    stats: [],
    sections: [
      {
        title: 'Course setup',
        eyebrow: 'Teaching operations',
        description: 'Prepare courses, groups, lessons, and assignment structure.',
        features: [
          {
            title: 'Manage Courses',
            description: 'Create courses, update course details, and open course workspaces.',
            status: 'Available',
            meta: 'Course portfolio',
            action: 'Manage Courses',
            path: '/lecturer/courses',
            icon: BookOpen,
            tone: 'green',
          },
          {
            title: 'Manage Groups',
            description: 'Generate groups, adjust formation deadlines, and review group membership.',
            status: 'Available',
            meta: 'Course workspace',
            action: 'Manage Groups',
            path: '/lecturer/courses',
            icon: UsersRound,
            tone: 'yellow',
          },
          {
            title: 'Manage Assignments',
            description: 'Browse courses and lessons to reach assignment grading and management screens.',
            status: 'Available',
            meta: 'Lessons and assignments',
            action: 'Open Assignments',
            path: '/lecturer/my-courses',
            icon: GraduationCap,
            tone: 'blue',
          },
        ],
      },
      {
        title: 'Assessment follow-up',
        eyebrow: 'Assessment workflow',
        description: 'Assign review work, monitor completion, and publish final grades.',
        features: [
          {
            title: 'Assign Peer Review',
            description: 'Create reviewer-to-target group pairs and check review coverage.',
            status: 'Available',
            meta: 'Peer review assignment',
            action: 'Assign Peer Review',
            path: '/lecturer/assignments/1/peer-review-assignments',
            icon: ClipboardCheck,
            tone: 'green',
          },
          {
            title: 'Monitor Progress',
            description: 'Track submissions, peer review completion, and evidence by group.',
            status: 'Available',
            meta: 'Course and assignment progress',
            action: 'Monitor Progress',
            path: '/lecturer/progress',
            icon: Activity,
            tone: 'blue',
          },
          {
            title: 'Manage Final Grades',
            description: 'Review evidence, save draft grades, and publish final results.',
            status: 'Available',
            meta: 'Final grades',
            action: 'Manage Grades',
            path: '/lecturer/my-courses',
            icon: Gauge,
            tone: 'purple',
          },
        ],
      },
      {
        title: 'Later support',
        eyebrow: 'Planned workspace',
        description: 'Deferred academic workflows remain visible without pretending they are implemented.',
        features: [
          {
            title: 'Appeals',
            description: 'Result appeal review is planned for a later phase.',
            status: 'Planned',
            meta: 'Appeal support',
            action: 'Not available',
            path: null,
            icon: FileText,
            tone: 'neutral',
          },
        ],
      },
    ],
  },
  ADMINISTRATOR: {
    label: 'Administrator',
    accent: 'administrator',
    heading: 'Administration workspace',
    description: 'Keep platform access and academic setup ready for the teaching team.',
    stats: [],
    sections: [
      {
        title: 'Administration tasks',
        eyebrow: 'Platform support',
        description: 'These workspaces are planned and are kept clearly separate from working features.',
        features: [
          {
            title: 'Manage Accounts',
            description: 'Review users, roles, and account status when account administration is connected.',
            status: 'Planned',
            meta: 'User access',
            action: 'Not available',
            path: null,
            icon: UserRound,
            tone: 'purple',
          },
          {
            title: 'Manage Courses',
            description: 'Support course setup and platform-level course oversight in a future phase.',
            status: 'Planned',
            meta: 'Course administration',
            action: 'Not available',
            path: null,
            icon: BookOpen,
            tone: 'green',
          },
          {
            title: 'System Settings',
            description: 'Configure platform policies after administrator tooling is implemented.',
            status: 'Planned',
            meta: 'Platform settings',
            action: 'Not available',
            path: null,
            icon: Settings,
            tone: 'neutral',
          },
        ],
      },
    ],
  },
}

const METRIC_ICONS = {
  activeCourses: CheckCircle2,
  activeUsers: CheckCircle2,
  assignedReviews: ClipboardCheck,
  assignments: FileText,
  courses: BookOpen,
  groups: UsersRound,
  incompleteReviews: Activity,
  joinedCourses: BookOpen,
  lecturers: GraduationCap,
  pendingReviews: ClipboardCheck,
  pendingSubmissions: FileText,
  publishedResults: Gauge,
  reviewTasks: ClipboardCheck,
  students: UsersRound,
  submittedAssignments: CheckCircle2,
  totalUsers: UsersRound,
  upcomingAssignments: CalendarClock,
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

function formatDateTime(value) {
  if (!value) return 'Not scheduled'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function metricIcon(metric) {
  return METRIC_ICONS[metric.key] ?? Activity
}

function metricNumber(dashboardData, key) {
  const metric = dashboardData?.metrics?.find((item) => item.key === key)
  const value = Number(metric?.value)
  return Number.isFinite(value) ? value : 0
}

function getTopMetrics(role, dashboardData, user, isDashboardLoading) {
  if (isDashboardLoading) {
    return [
      { key: 'loading-primary', label: 'Loading', value: '...', icon: Activity },
      { key: 'loading-secondary', label: 'Overview', value: '...', icon: Gauge },
      { key: 'account-status', label: 'Status', value: user.status, icon: ShieldCheck },
    ]
  }

  if (role === 'STUDENT') {
    const pendingTasks = metricNumber(dashboardData, 'pendingSubmissions')
      + metricNumber(dashboardData, 'pendingReviews')

    return [
      { key: 'joinedCourses', label: 'Courses', value: metricNumber(dashboardData, 'joinedCourses'), icon: BookOpen },
      { key: 'pendingTasks', label: 'Pending tasks', value: pendingTasks, icon: Activity },
      { key: 'publishedResults', label: 'Results', value: metricNumber(dashboardData, 'publishedResults'), icon: Gauge },
    ]
  }

  if (role === 'LECTURER') {
    const needsAttention = metricNumber(dashboardData, 'pendingSubmissions')
      + metricNumber(dashboardData, 'incompleteReviews')

    return [
      { key: 'activeCourses', label: 'Active courses', value: metricNumber(dashboardData, 'activeCourses'), icon: BookOpen },
      { key: 'assignments', label: 'Assignments', value: metricNumber(dashboardData, 'assignments'), icon: FileText },
      { key: 'needsAttention', label: 'Needs attention', value: needsAttention, icon: AlertCircle },
      { key: 'reviewTasks', label: 'Review tasks', value: metricNumber(dashboardData, 'reviewTasks'), icon: ClipboardCheck },
    ]
  }

  if (role === 'ADMINISTRATOR') {
    return [
      { key: 'totalUsers', label: 'Users', value: metricNumber(dashboardData, 'totalUsers'), icon: UsersRound },
      { key: 'courses', label: 'Courses', value: metricNumber(dashboardData, 'courses'), icon: BookOpen },
      { key: 'groups', label: 'Groups', value: metricNumber(dashboardData, 'groups'), icon: UsersRound },
      { key: 'assignments', label: 'Assignments', value: metricNumber(dashboardData, 'assignments'), icon: FileText },
    ]
  }

  return [
    { key: 'account-status', label: 'Status', value: user.status, icon: ShieldCheck },
  ]
}

function FeatureCard({ feature, onOpen }) {
  const Icon = feature.icon
  const disabled = !feature.path

  return (
    <article className={`lecturer-feature-card lecturer-feature-card--${feature.tone}`}>
      <div className="lecturer-feature-card__top">
        <span className="lecturer-feature-card__icon">
          <Icon size={22} aria-hidden="true" />
        </span>
        <span className={`feature-status feature-status--${feature.status.toLowerCase()}`}>
          {feature.status}
        </span>
      </div>
      <div>
        <small>{feature.meta}</small>
        <h3>{feature.title}</h3>
        <p>{feature.description}</p>
      </div>
      <button
        className={disabled ? 'feature-action feature-action--disabled' : 'feature-action'}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && onOpen(feature.path)}
      >
        {feature.action}
        {!disabled && <ArrowUpRight size={17} aria-hidden="true" />}
      </button>
    </article>
  )
}

function DashboardList({ emptyText, items, renderItem }) {
  if (!items.length) {
    return <p className="dashboard-data-empty">{emptyText}</p>
  }

  return (
    <div className="dashboard-data-list">
      {items.map(renderItem)}
    </div>
  )
}

function WorkboardCard({ action, children, meta, onClick, title }) {
  return (
    <article className="workboard-card">
      <div>
        {meta && <small>{meta}</small>}
        <h3>{title}</h3>
      </div>
      <div className="workboard-card__body">
        {children}
      </div>
      {action && (
        <button className="workboard-card__action" type="button" onClick={onClick}>
          {action}
          <ArrowUpRight size={15} aria-hidden="true" />
        </button>
      )}
    </article>
  )
}

function StudentWorkboard({ dashboardData, onOpen }) {
  if (!dashboardData) return null

  const courses = dashboardData.joinedCourses || []
  const assignments = dashboardData.upcomingAssignments || []
  const assignedReviews = metricNumber(dashboardData, 'assignedReviews')
  const pendingReviews = metricNumber(dashboardData, 'pendingReviews')
  const publishedResults = metricNumber(dashboardData, 'publishedResults')

  return (
    <section className="role-workboard" aria-label="Student workboard">
      <WorkboardCard meta="Learning" title="My Courses">
        <DashboardList
          emptyText="No joined courses yet."
          items={courses.slice(0, 4)}
          renderItem={(course) => (
            <div className="dashboard-data-row" key={course.id}>
              <div>
                <strong>{course.courseName}</strong>
                <span>{course.classCode} / {course.status}</span>
              </div>
              <small>{course.groupCount} groups</small>
            </div>
          )}
        />
      </WorkboardCard>

      <WorkboardCard meta="Assignments" title="Upcoming Work">
        <DashboardList
          emptyText="No upcoming assignments."
          items={assignments.slice(0, 4)}
          renderItem={(assignment) => (
            <div className="dashboard-data-row" key={assignment.id}>
              <div>
                <strong>{assignment.title}</strong>
                <span>{assignment.courseName}</span>
              </div>
              <small>Due {formatDateTime(assignment.submissionDeadline)}</small>
            </div>
          )}
        />
      </WorkboardCard>

      <WorkboardCard
        action={assignedReviews > 0 ? 'Open review task' : null}
        meta="Peer review"
        onClick={() => onOpen('/peer-reviews/tasks/1')}
        title="Peer Reviews"
      >
        <div className="workboard-metric-row">
          <span>Assigned</span>
          <strong>{assignedReviews}</strong>
        </div>
        <div className="workboard-metric-row">
          <span>Pending</span>
          <strong>{pendingReviews}</strong>
        </div>
      </WorkboardCard>

      <WorkboardCard meta="Published grades" title="Published Results">
        <div className="workboard-metric-row">
          <span>Released</span>
          <strong>{publishedResults}</strong>
        </div>
        <p className="dashboard-data-empty">Released scores and feedback will appear in the results workspace.</p>
      </WorkboardCard>
    </section>
  )
}

function LecturerWorkboard({ dashboardData, onOpen }) {
  if (!dashboardData) return null

  const courses = dashboardData.courses || []
  const assignments = dashboardData.upcomingAssignments || []
  const pendingSubmissions = metricNumber(dashboardData, 'pendingSubmissions')
  const incompleteReviews = metricNumber(dashboardData, 'incompleteReviews')

  return (
    <section className="role-workboard role-workboard--lecturer" aria-label="Lecturer workboard">
      <WorkboardCard action="Open courses" meta="Courses" onClick={() => onOpen('/lecturer/courses')} title="Teaching Courses">
        <DashboardList
          emptyText="No courses assigned."
          items={courses.slice(0, 4)}
          renderItem={(course) => (
            <button
              className="dashboard-data-row dashboard-data-row--button"
              key={course.id}
              type="button"
              onClick={() => onOpen(`/lecturer/courses/${course.id}/workspace`)}
            >
              <div>
                <strong>{course.courseName}</strong>
                <span>{course.classCode} / {course.status}</span>
              </div>
              <small>{course.assignmentCount} assignments / {course.groupCount} groups</small>
            </button>
          )}
        />
      </WorkboardCard>

      <WorkboardCard action="Monitor progress" meta="Assessment" onClick={() => onOpen('/lecturer/progress')} title="Monitor Progress">
        <div className="workboard-metric-row">
          <span>Pending submissions</span>
          <strong>{pendingSubmissions}</strong>
        </div>
        <div className="workboard-metric-row">
          <span>Unfinished reviews</span>
          <strong>{incompleteReviews}</strong>
        </div>
      </WorkboardCard>

      <WorkboardCard meta="Actions" title="Assessment Actions">
        <div className="quick-action-stack">
          <button type="button" onClick={() => onOpen('/lecturer/assignments/1/peer-review-assignments')}>
            Assign Peer Review
            <ArrowUpRight size={15} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => onOpen('/lecturer/my-courses')}>
            Manage Assignments
            <ArrowUpRight size={15} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => onOpen('/lecturer/my-courses')}>
            Manage Final Grades
            <ArrowUpRight size={15} aria-hidden="true" />
          </button>
        </div>
      </WorkboardCard>

      <WorkboardCard meta="Deadlines" title="Upcoming Deadlines">
        <DashboardList
          emptyText="No upcoming deadlines."
          items={assignments.slice(0, 4)}
          renderItem={(assignment) => (
            <div className="dashboard-data-row" key={assignment.id}>
              <div>
                <strong>{assignment.title}</strong>
                <span>{assignment.courseName}</span>
              </div>
              <small>{formatDateTime(assignment.submissionDeadline)}</small>
            </div>
          )}
        />
      </WorkboardCard>
    </section>
  )
}

function AdminWorkboard({ dashboardData }) {
  if (!dashboardData) return null

  const recentCourses = dashboardData.recentCourses || []
  const totalUsers = metricNumber(dashboardData, 'totalUsers')
  const lecturers = metricNumber(dashboardData, 'lecturers')
  const students = metricNumber(dashboardData, 'students')
  const administrators = Math.max(totalUsers - lecturers - students, 0)
  const courses = metricNumber(dashboardData, 'courses')
  const activeCourses = metricNumber(dashboardData, 'activeCourses')
  const archivedCourses = Math.max(courses - activeCourses, 0)

  return (
    <section className="role-workboard role-workboard--admin" aria-label="Administration overview">
      <WorkboardCard meta="Accounts" title="Users by Role">
        <div className="dashboard-summary-table">
          <div><span>Administrators</span><strong>{administrators}</strong></div>
          <div><span>Lecturers</span><strong>{lecturers}</strong></div>
          <div><span>Students</span><strong>{students}</strong></div>
        </div>
      </WorkboardCard>

      <WorkboardCard meta="Courses" title="Course Status">
        <div className="dashboard-summary-table">
          <div><span>Active</span><strong>{activeCourses}</strong></div>
          <div><span>Archived</span><strong>{archivedCourses}</strong></div>
        </div>
      </WorkboardCard>

      <WorkboardCard meta="Records" title="System Records">
        <div className="dashboard-summary-table">
          <div><span>Courses</span><strong>{courses}</strong></div>
          <div><span>Groups</span><strong>{metricNumber(dashboardData, 'groups')}</strong></div>
          <div><span>Assignments</span><strong>{metricNumber(dashboardData, 'assignments')}</strong></div>
        </div>
      </WorkboardCard>

      <WorkboardCard meta="Recent setup" title="Recent Courses">
        <DashboardList
          emptyText="No courses have been created."
          items={recentCourses.slice(0, 4)}
          renderItem={(course) => (
            <div className="dashboard-data-row" key={course.id}>
              <div>
                <strong>{course.courseName}</strong>
                <span>{course.classCode} / {course.status}</span>
              </div>
              <small>{course.assignmentCount} assignments</small>
            </div>
          )}
        />
      </WorkboardCard>
    </section>
  )
}

function DashboardDataPanel({ dashboardData, onOpen, role }) {
  if (role === 'STUDENT') {
    return <StudentWorkboard dashboardData={dashboardData} onOpen={onOpen} />
  }

  if (role === 'LECTURER') {
    return <LecturerWorkboard dashboardData={dashboardData} onOpen={onOpen} />
  }

  if (role === 'ADMINISTRATOR') {
    return <AdminWorkboard dashboardData={dashboardData} />
  }

  return null
}

function RoleOverview({ dashboardData, dashboardError, isDashboardLoading, onRetryDashboard, roleContent, user }) {
  const navigate = useNavigate()
  const metrics = getTopMetrics(user.role, dashboardData, user, isDashboardLoading)

  return (
    <>
      <section className="welcome-band role-overview-hero">
        <div>
          <p className="dashboard-date">{formatDate(new Date())}</p>
          <h1>{roleContent.heading}</h1>
          <p>Welcome back, {user.fullName.split(' ')[0]}. {roleContent.description}</p>
        </div>
        <div className="welcome-band__badges">
          <span className={`role-badge role-badge--${roleContent.accent}`}>
            {roleContent.label}
          </span>
          <span className="status-badge">
            <span aria-hidden="true" />
            {user.status}
          </span>
        </div>
      </section>

      <section className="stats-grid" aria-label={`${roleContent.label} summary`}>
        {metrics.map((metric) => {
          const Icon = metric.icon ?? metricIcon(metric)
          return (
            <article className="stat-card" key={metric.key}>
              <span className={`stat-card__icon stat-card__icon--${roleContent.accent}`}>
                <Icon size={21} aria-hidden="true" />
              </span>
              <p>{metric.label}</p>
              <strong>{metric.value}</strong>
              {metric.hint && <small>{metric.hint}</small>}
            </article>
          )
        })}
      </section>

      {dashboardError && (
        <section className="dashboard-inline-error" role="status">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{dashboardError}</span>
          <button type="button" onClick={onRetryDashboard}>Retry</button>
        </section>
      )}

      {!isDashboardLoading && !dashboardError && (
        <DashboardDataPanel dashboardData={dashboardData} onOpen={navigate} role={user.role} />
      )}

      {roleContent.sections.map((section) => (
        <section className="lecturer-hub-section" aria-labelledby={`${section.title}-title`} key={section.title}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">{section.eyebrow}</p>
              <h2 id={`${section.title}-title`}>{section.title}</h2>
              <p>{section.description}</p>
            </div>
          </div>
          <div className="lecturer-feature-grid">
            {section.features.map((feature) => (
              <FeatureCard feature={feature} key={feature.title} onOpen={navigate} />
            ))}
          </div>
        </section>
      ))}
    </>
  )
}

function HomePage() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const roleContent = ROLE_CONTENT[user.role] ?? ROLE_CONTENT.STUDENT
  const [dashboardData, setDashboardData] = useState(null)
  const [isDashboardLoading, setIsDashboardLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState('')
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0)

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      setIsDashboardLoading(true)
      setDashboardError('')

      try {
        const response = await getRoleDashboard(user.role, token)
        if (active) setDashboardData(response)
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          logout()
          navigate('/login', { replace: true })
          return
        }
        if (active) setDashboardError(error.message || 'Dashboard data could not be loaded.')
      } finally {
        if (active) setIsDashboardLoading(false)
      }
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [dashboardRefreshKey, logout, navigate, token, user.role])

  return (
    <div className="dashboard-shell">
      <DashboardTopbar icon={LayoutDashboard} label="Overview" />

      <main className="dashboard-main">
<<<<<<< HEAD
        <RoleOverview
          dashboardData={dashboardData}
          dashboardError={dashboardError}
          isDashboardLoading={isDashboardLoading}
          onRetryDashboard={() => {
            setDashboardData(null)
            setDashboardRefreshKey((current) => current + 1)
          }}
          roleContent={roleContent}
          user={user}
        />
=======
        <section className="welcome-band">
          <div>
            <p className="dashboard-date">{formatDate(new Date())}</p>
            <h1>Welcome back, {user.fullName.split(' ')[0]}.</h1>
            <p>{roleContent.description}</p>
          </div>
          <div className="welcome-band__badges">
            <span className={`role-badge role-badge--${roleContent.accent}`}>
              {roleContent.label}
            </span>
            <span className="status-badge">
              <span aria-hidden="true" />
              {user.status}
            </span>
          </div>
        </section>

        <section className="stats-grid" aria-label="Workspace summary">
          {roleContent.stats.map(({ label, value, hint, icon: Icon }) => (
            <article className="stat-card" key={label}>
              <span className={`stat-card__icon stat-card__icon--${roleContent.accent}`}>
                <Icon size={21} />
              </span>
              <p>{label}</p>
              <strong>{value}</strong>
              <small>{hint}</small>
            </article>
          ))}
        </section>

        {user.role === 'LECTURER' && (
          <section className="lecturer-demo-section" aria-labelledby="demo-workspaces-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Current demo data</p>
                <h2 id="demo-workspaces-title">Use-case workspaces</h2>
              </div>
            </div>
            <div className="lecturer-demo-grid">
              <article className="demo-feature" aria-labelledby="uc02-demo-title">
                <div className="demo-feature__icon">
                  <BookOpen size={23} aria-hidden="true" />
                </div>
                <div className="demo-feature__copy">
                  <div className="demo-feature__meta">
                    <span>UC-02</span>
                    <small>Manage Courses</small>
                  </div>
                  <h2 id="uc02-demo-title">Course Management</h2>
                  <p>Create and manage your courses, view course details, and access course workspaces.</p>
                </div>
                <button
                  className="demo-feature__action"
                  type="button"
                  onClick={() => navigate('/lecturer/courses')}
                >
                  Manage Courses
                  <ArrowUpRight size={18} aria-hidden="true" />
                </button>
              </article>

              <article className="demo-feature" aria-labelledby="uc14-demo-title">
                <div className="demo-feature__icon">
                  <ClipboardCheck size={23} aria-hidden="true" />
                </div>
                <div className="demo-feature__copy">
                  <div className="demo-feature__meta">
                    <span>UC-14 demo</span>
                    <small>Assignment #1</small>
                  </div>
                  <h2 id="uc14-demo-title">Assign peer reviews</h2>
                  <p>Pair reviewer and target groups, then check review coverage.</p>
                </div>
                <button
                  className="demo-feature__action"
                  type="button"
                  onClick={() => navigate('/lecturer/assignments/1/peer-review-assignments')}
                >
                  Open UC-14
                  <ArrowUpRight size={18} aria-hidden="true" />
                </button>
              </article>

              <article className="demo-feature demo-feature--progress" aria-labelledby="uc08-demo-title">
                <div className="demo-feature__icon">
                  <Activity size={23} aria-hidden="true" />
                </div>
                <div className="demo-feature__copy">
                  <div className="demo-feature__meta">
                    <span>UC-08 demo</span>
                    <small>Course #2 · Assignment #2</small>
                  </div>
                  <h2 id="uc08-demo-title">Monitor Progress</h2>
                  <p>Review submission and peer review progress across all course groups.</p>
                </div>
                <button
                  className="demo-feature__action"
                  type="button"
                  onClick={() => navigate('/lecturer/courses/2/assignments/2/progress')}
                >
                  Open Monitor Progress
                  <ArrowUpRight size={18} aria-hidden="true" />
                </button>
              </article>
            </div>
          </section>
        )}




        <section className="dashboard-grid">
          <div className="workspace-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Role overview</p>
                <h2>{roleContent.heading}</h2>
              </div>
            </div>

            <div className="focus-list">
              {roleContent.focus.map(({ title, detail, icon: Icon, path }) => (
                <div
                  className={`focus-row ${path ? 'focus-row--clickable' : ''}`}
                  key={title}
                  onClick={path ? () => navigate(path) : undefined}
                >
                  <span className={`focus-row__icon focus-row__icon--${roleContent.accent}`}>
                    <Icon size={20} />
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <span>{detail}</span>
                  </div>
                  <span
                    className="placeholder-state"
                    style={path ? { cursor: 'pointer', background: 'var(--blue-soft)', color: 'var(--blue)' } : undefined}
                  >
                    Preview
                  </span>
                  <ArrowUpRight
                    size={18}
                    aria-hidden="true"
                    style={path ? { cursor: 'pointer', color: 'var(--blue)' } : undefined}
                  />
                </div>
              ))}
            </div>
          </div>

          <aside className="profile-panel" aria-labelledby="profile-heading">
            <div className="profile-panel__heading">
              <span className={`user-avatar user-avatar--large user-avatar--${roleContent.accent}`}>
                {user.fullName
                  .split(' ')
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </span>
              <div>
                <p className="eyebrow">Signed-in profile</p>
                <h2 id="profile-heading">{user.fullName}</h2>
              </div>
            </div>

            <dl className="profile-details">
              <div>
                <dt><UserRound size={17} aria-hidden="true" /> Username</dt>
                <dd>{user.username}</dd>
              </div>
              <div>
                <dt><Mail size={17} aria-hidden="true" /> Email</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt><ShieldCheck size={17} aria-hidden="true" /> Role</dt>
                <dd>{roleContent.label}</dd>
              </div>
            </dl>
          </aside>
        </section>
>>>>>>> 5abb507 (fix: Update UC07 peer review backend and frontend implementation)
      </main>
    </div>
  )
}

export default HomePage
