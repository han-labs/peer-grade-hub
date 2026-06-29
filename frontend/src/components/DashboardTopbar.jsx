import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  FileText,
  Gauge,
  Eye,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import BrandMark from './BrandMark.jsx'

const ROLE_LABELS = {
  ADMINISTRATOR: 'Administrator',
  LECTURER: 'Lecturer',
  STUDENT: 'Student',
}

const ROLE_NAV_GROUPS = {
  ADMINISTRATOR: [
    {
      title: 'Workspace',
      items: [
        {
          label: 'Overview',
          to: '/admin',
          icon: LayoutDashboard,
          status: 'Available',
          activePaths: ['/dashboard', '/admin', '/admin/dashboard'],
        },
      ],
    },
    {
      title: 'Administration',
      items: [
        { label: 'Manage Accounts', icon: UsersRound, status: 'Soon' },
        { label: 'Manage Courses', icon: BookOpen, status: 'Soon' },
        { label: 'System Settings', icon: Settings, status: 'Soon' },
      ],
    },
  ],
  LECTURER: [
    {
      title: 'Teaching',
      items: [
        {
          label: 'Overview',
          to: '/lecturer',
          icon: LayoutDashboard,
          status: 'Available',
          activePaths: ['/dashboard', '/lecturer', '/lecturer/dashboard'],
          activeLabels: ['Overview'],
        },
        {
          label: 'Manage Courses',
          to: '/lecturer/courses',
          icon: BookOpen,
          status: 'Available',
          activeLabels: ['Manage Courses', 'Course Workspace'],
        },
        {
          label: 'Manage Groups',
          to: '/lecturer/courses',
          icon: UsersRound,
          status: 'Available',
          activeLabels: ['Group Management'],
        },
        {
          label: 'Manage Assignments',
          to: '/lecturer/my-courses',
          icon: GraduationCap,
          status: 'Available',
          activeLabels: ['My Courses', 'Course Lessons', 'Lesson Assignments'],
        },
      ],
    },
    {
      title: 'Assessment',
      items: [
        {
          label: 'Assign Peer Review',
          to: '/lecturer/assignments/1/peer-review-assignments',
          icon: ClipboardCheck,
          status: 'Sample',
          activeLabels: ['Peer review assignments'],
          activeMatcher: (pathname) => pathname.includes('/peer-review-assignments'),
        },
        {
          label: 'Monitor Progress',
          to: '/lecturer/courses/2/assignments/2/progress',
          icon: BarChart3,
          status: 'Sample',
          activeLabels: ['Monitor progress'],
          activeMatcher: (pathname) => pathname.includes('/progress'),
        },
        {
          label: 'Manage Final Grades',
          to: '/lecturer/my-courses',
          icon: Gauge,
          status: 'Available',
          activeLabels: ['Manage Final Grades'],
        },
      ],
    },
  ],
  STUDENT: [
  {
    title: 'Learning',
    items: [
      {
        label: 'Overview',
        to: '/student',
        icon: LayoutDashboard,
        status: 'Available',
        activePaths: ['/dashboard', '/student', '/student/dashboard'],
      },
      {
        label: 'My Courses',
        to: '/student/courses',
        icon: BookOpen,
        status: 'Available',
        activeLabels: ['My Courses'],
      },
      {
        label: 'View Results',
        to: '/student/courses',  
        icon: Eye,
        status: 'Available',
        activeMatcher: (pathname) => pathname.includes('/results') || pathname.includes('/student/courses'),
      },
      {
        label: 'Submit Peer Review',
        to: '/peer-reviews/tasks/1',
        icon: ClipboardCheck,
        status: 'Sample',
        activeLabels: ['Submit Peer Review'],
        activeMatcher: (pathname) => pathname.includes('/peer-reviews/tasks'),
      },
      { label: 'Join Course / Group', icon: UsersRound, status: 'Soon' },
      { label: 'Submit Assignment', icon: FileText, status: 'Soon' },
    ],
  },
],
}

function getInitials(fullName) {
  return fullName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getDashboardPath(role) {
  if (role === 'LECTURER') return '/lecturer'
  if (role === 'ADMINISTRATOR') return '/admin'
  return '/student'
}

function ProfileDialog({ initials, onClose, onLogout, roleAccent, user }) {
  return (
    <div className="profile-dialog-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="profile-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="profile-dialog__header">
          <div className="profile-dialog__identity">
            <span className={`user-avatar user-avatar--large user-avatar--${roleAccent}`}>
              {initials}
            </span>
            <div>
              <p className="eyebrow">Signed-in profile</p>
              <h2 id="profile-dialog-title">{user.fullName}</h2>
            </div>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close profile">
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        <dl className="profile-dialog__details">
          <div>
            <dt><UserRound size={17} aria-hidden="true" /> Username</dt>
            <dd>{user.username}</dd>
          </div>
          <div>
            <dt><ShieldCheck size={17} aria-hidden="true" /> Role</dt>
            <dd>{ROLE_LABELS[user.role] ?? user.role}</dd>
          </div>
          <div>
            <dt><FileText size={17} aria-hidden="true" /> Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt><ShieldCheck size={17} aria-hidden="true" /> Status</dt>
            <dd>{user.status}</dd>
          </div>
        </dl>

        <button className="profile-dialog__logout" type="button" onClick={onLogout}>
          <LogOut size={18} aria-hidden="true" />
          Log out
        </button>
      </aside>
    </div>
  )
}

function DashboardTopbar({ icon: Icon, label }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const roleAccent = user.role.toLowerCase()
  const initials = useMemo(() => getInitials(user.fullName), [user.fullName])
  const navGroups = ROLE_NAV_GROUPS[user.role] ?? ROLE_NAV_GROUPS.STUDENT

  function handleLogout() {
    logout()
    setIsProfileOpen(false)
    navigate('/login', { replace: true })
  }

  function isItemActive(item) {
    return (
      item.activeLabels?.includes(label) ||
      item.activePaths?.includes(location.pathname) ||
      item.activeMatcher?.(location.pathname) ||
      false
    )
  }

  return (
    <>
      <aside className="role-sidebar lecturer-sidebar" aria-label={`${ROLE_LABELS[user.role] ?? 'User'} navigation`}>
        <div className="role-sidebar__brand lecturer-sidebar__brand">
          <BrandMark compact />
          <p>{ROLE_LABELS[user.role] ?? 'Workspace'} workspace</p>
        </div>

        <nav className="role-sidebar__nav lecturer-sidebar__nav">
          {navGroups.map((group) => (
            <div className="role-nav-group lecturer-nav-group" key={group.title}>
              <span className="role-nav-group__title lecturer-nav-group__title">{group.title}</span>
              {group.items.map((item) => {
                const ItemIcon = item.icon
                const active = isItemActive(item)

                if (!item.to) {
                  return (
                    <button
                      className="role-nav-link lecturer-nav-link role-nav-link--disabled"
                      type="button"
                      disabled
                      key={`${group.title}-${item.label}`}
                    >
                      <span className="role-nav-link__icon lecturer-nav-link__icon">
                        <ItemIcon size={18} aria-hidden="true" />
                      </span>
                      <span className="role-nav-link__copy lecturer-nav-link__copy">
                        <strong>{item.label}</strong>
                        <small>{item.status}</small>
                      </span>
                    </button>
                  )
                }

                return (
                  <NavLink
                    className={`role-nav-link lecturer-nav-link ${active ? 'role-nav-link--active lecturer-nav-link--active' : ''}`}
                    to={item.to}
                    key={`${group.title}-${item.label}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className="role-nav-link__icon lecturer-nav-link__icon">
                      <ItemIcon size={18} aria-hidden="true" />
                    </span>
                    <span className="role-nav-link__copy lecturer-nav-link__copy">
                      <strong>{item.label}</strong>
                      <small>{item.status}</small>
                    </span>
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        <button
          className="role-sidebar__profile lecturer-sidebar__profile"
          type="button"
          onClick={() => setIsProfileOpen(true)}
        >
          <span className={`user-avatar user-avatar--${roleAccent}`}>{initials}</span>
          <span>
            <strong>{user.fullName}</strong>
            <small>{user.email}</small>
          </span>
        </button>
      </aside>

      <header className="topbar topbar--role topbar--lecturer">
        <button
          className="topbar__current"
          type="button"
          onClick={() => navigate(getDashboardPath(user.role))}
        >
          <span className="topbar__active">
            <Icon size={18} aria-hidden="true" />
            {label}
          </span>
        </button>
        <div className="topbar__account">
          <button
            className="topbar-profile-button"
            type="button"
            onClick={() => setIsProfileOpen(true)}
          >
            <span className={`user-avatar user-avatar--${roleAccent}`}>{initials}</span>
            <span className="topbar__identity">
              <strong>{user.fullName}</strong>
              <small>@{user.username}</small>
            </span>
          </button>
          <button className="logout-button" onClick={handleLogout} type="button">
            <LogOut size={18} aria-hidden="true" />
            <span>Log out</span>
          </button>
        </div>
      </header>

      {isProfileOpen && (
        <ProfileDialog
          initials={initials}
          onClose={() => setIsProfileOpen(false)}
          onLogout={handleLogout}
          roleAccent={roleAccent}
          user={user}
        />
      )}
    </>
  )
}

export default DashboardTopbar
