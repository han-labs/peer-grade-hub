import {
  Activity,
  ArrowUpRight,
  BookOpen,
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
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import DashboardTopbar from '../components/DashboardTopbar.jsx'

const ROLE_CONTENT = {
  STUDENT: {
    label: 'Student',
    accent: 'student',
    heading: 'Learning workspace',
    description: 'Keep courses, group work, peer reviews, and published results organized.',
    stats: [
      { label: 'Courses', value: '-', hint: 'Join course support is coming next', icon: BookOpen },
      { label: 'Peer reviews', value: '1', hint: 'Sample review task available', icon: ClipboardCheck },
      { label: 'Account status', value: 'Active', hint: 'Ready to participate', icon: CheckCircle2 },
    ],
    sections: [
      {
        title: 'Study tasks',
        eyebrow: 'What to do next',
        description: 'Open the workspaces available for your current learning flow.',
        features: [
          {
            title: 'Submit Peer Review',
            description: 'Open your assigned review task, inspect the submission, then submit score and feedback.',
            status: 'Sample',
            meta: 'Peer review task',
            action: 'Submit Review',
            path: '/peer-reviews/tasks/1',
            icon: ClipboardCheck,
            tone: 'blue',
          },
          {
            title: 'Join Course / Group',
            description: 'Join a course with an invitation code and participate in group formation.',
            status: 'Soon',
            meta: 'Course enrollment',
            action: 'Coming soon',
            path: null,
            icon: UsersRound,
            tone: 'green',
          },
          {
            title: 'Submit Assignment',
            description: 'Upload group submissions and supporting materials once the submission flow is connected.',
            status: 'Soon',
            meta: 'Assignment submission',
            action: 'Coming soon',
            path: null,
            icon: FileText,
            tone: 'yellow',
          },
          {
            title: 'View Results',
            description: 'Review published final scores and feedback after lecturers release results.',
            status: 'Soon',
            meta: 'Published grades',
            action: 'Coming soon',
            path: null,
            icon: Gauge,
            tone: 'purple',
          },
        ],
      },
    ],
  },
  LECTURER: {
    label: 'Lecturer',
    accent: 'lecturer',
    heading: 'Teaching workspace',
    description: 'Manage courses, groups, assignments, peer reviews, progress, and final grades.',
    stats: [
      { label: 'Courses', value: '-', hint: 'Manage live courses', icon: BookOpen },
      { label: 'Group progress', value: '-', hint: 'Open monitoring for live detail', icon: UsersRound },
      { label: 'Account status', value: 'Active', hint: 'Teaching access', icon: CheckCircle2 },
    ],
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
            action: 'Choose Course',
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
            status: 'Sample',
            meta: 'Peer review assignment',
            action: 'Assign Peer Review',
            path: '/lecturer/assignments/1/peer-review-assignments',
            icon: ClipboardCheck,
            tone: 'green',
          },
          {
            title: 'Monitor Progress',
            description: 'Track submissions, peer review completion, and evidence by group.',
            status: 'Sample',
            meta: 'Progress dashboard',
            action: 'Monitor Progress',
            path: '/lecturer/courses/2/assignments/2/progress',
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
            status: 'Soon',
            meta: 'Appeal support',
            action: 'Coming soon',
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
    stats: [
      { label: 'Accounts', value: '-', hint: 'User management is planned', icon: UsersRound },
      { label: 'Courses', value: '-', hint: 'Course oversight is planned', icon: BookOpen },
      { label: 'Account status', value: 'Active', hint: 'Administrator access', icon: ShieldCheck },
    ],
    sections: [
      {
        title: 'Administration tasks',
        eyebrow: 'Platform support',
        description: 'These workspaces are planned and are kept clearly separate from working features.',
        features: [
          {
            title: 'Manage Accounts',
            description: 'Review users, roles, and account status when account administration is connected.',
            status: 'Soon',
            meta: 'User access',
            action: 'Coming soon',
            path: null,
            icon: UserRound,
            tone: 'purple',
          },
          {
            title: 'Manage Courses',
            description: 'Support course setup and platform-level course oversight in a future phase.',
            status: 'Soon',
            meta: 'Course administration',
            action: 'Coming soon',
            path: null,
            icon: BookOpen,
            tone: 'green',
          },
          {
            title: 'System Settings',
            description: 'Configure platform policies after administrator tooling is implemented.',
            status: 'Soon',
            meta: 'Platform settings',
            action: 'Coming soon',
            path: null,
            icon: Settings,
            tone: 'neutral',
          },
        ],
      },
    ],
  },
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date)
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

function RoleOverview({ roleContent, user }) {
  const navigate = useNavigate()

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
        {roleContent.stats.map(({ label, value, hint, icon: Icon }) => (
          <article className="stat-card" key={label}>
            <span className={`stat-card__icon stat-card__icon--${roleContent.accent}`}>
              <Icon size={21} aria-hidden="true" />
            </span>
            <p>{label}</p>
            <strong>{value}</strong>
            <small>{hint}</small>
          </article>
        ))}
      </section>

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
  const { user } = useAuth()
  const roleContent = ROLE_CONTENT[user.role] ?? ROLE_CONTENT.STUDENT

  return (
    <div className="dashboard-shell">
      <DashboardTopbar icon={LayoutDashboard} label="Overview" />

      <main className="dashboard-main">
        <RoleOverview roleContent={roleContent} user={user} />
      </main>
    </div>
  )
}

export default HomePage
