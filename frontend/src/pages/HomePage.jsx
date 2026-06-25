import {
  Activity,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Mail,
  ShieldCheck,
  UserRound,
  UsersRound,
  Gauge,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import DashboardTopbar from '../components/DashboardTopbar.jsx'

const ROLE_CONTENT = {
  STUDENT: {
    label: 'Student',
    accent: 'student',
    heading: 'Your learning workspace',
    description: 'Keep course work and peer review responsibilities in view.',
    stats: [
      { label: 'Enrolled courses', value: '—', hint: 'Course workspace', icon: BookOpen },
      { label: 'Pending reviews', value: '—', hint: 'Review queue', icon: ClipboardCheck },
      { label: 'Account status', value: 'Active', hint: 'Ready to participate', icon: CheckCircle2 },
    ],
    focus: [
      { title: 'Joined courses', detail: 'Course enrollment summary', icon: BookOpen },
      { title: 'Peer review tasks', detail: 'Assigned review queue', icon: UsersRound },
    ],
  },
  LECTURER: {
    label: 'Lecturer',
    accent: 'lecturer',
    heading: 'Your teaching workspace',
    description: 'Track courses, groups, and assessment progress from one place.',
    stats: [
      { label: 'Managed courses', value: '—', hint: 'Course portfolio', icon: BookOpen },
      { label: 'Groups in progress', value: '—', hint: 'Monitoring view', icon: UsersRound },
      { label: 'Account status', value: 'Active', hint: 'Teaching access', icon: CheckCircle2 },
    ],
    focus: [
      { title: 'Course management', detail: 'Modules and assignments', icon: GraduationCap },
      { title: 'Progress monitoring', detail: 'Submission and review status', icon: Activity },
    ],
  },
  ADMINISTRATOR: {
    label: 'Administrator',
    accent: 'administrator',
    heading: 'Your administration workspace',
    description: 'Maintain account access and keep the platform organized.',
    stats: [
      { label: 'User accounts', value: '—', hint: 'Account directory', icon: UsersRound },
      { label: 'Courses', value: '—', hint: 'Platform overview', icon: BookOpen },
      { label: 'Account status', value: 'Active', hint: 'Administrator access', icon: ShieldCheck },
    ],
    focus: [
      { title: 'User management', detail: 'Roles and account status', icon: UserRound },
      { title: 'Course overview', detail: 'Platform course directory', icon: BookOpen },
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

function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const roleContent = ROLE_CONTENT[user.role] ?? ROLE_CONTENT.STUDENT

  return (
    <div className="dashboard-shell">
      <DashboardTopbar icon={LayoutDashboard} label="Overview" />

      <main className="dashboard-main">
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
              <article className="demo-feature demo-feature--grade" aria-labelledby="uc09-demo-title">
                <div className="demo-feature__icon">
                  <Gauge size={23} aria-hidden="true" />
                </div>
                <div className="demo-feature__copy">
                  <div className="demo-feature__meta">
                    <span>UC-09 demo</span>
                    <small>Assignment #1</small>
                  </div>
                  <h2 id="uc09-demo-title">Manage Final Grades</h2>
                  <p>Review submissions, peer reviews, and publish final grades for each group.</p>
                </div>
                <button
                  className="demo-feature__action"
                  type="button"
                  onClick={() => navigate('/lecturer/courses')}  // Đi đến danh sách courses
                >
                  Go to Courses
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
              {roleContent.focus.map(({ title, detail, icon: Icon }) => (
                <div className="focus-row" key={title}>
                  <span className={`focus-row__icon focus-row__icon--${roleContent.accent}`}>
                    <Icon size={20} />
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <span>{detail}</span>
                  </div>
                  <span className="placeholder-state">Preview</span>
                  <ArrowUpRight size={18} aria-hidden="true" />
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
      </main>
    </div>
  )
}

export default HomePage
