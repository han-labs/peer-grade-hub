import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileClock,
  FileWarning,
  Inbox,
  RefreshCw,
  ShieldAlert,
  UsersRound,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getFilteredProgressGroups,
  getGroupMonitoringDetails,
  getProgressDashboard,
} from '../api/progressApi.js'
import { ApiError } from '../api/httpClient.js'
import { useAuth } from '../auth/useAuth.js'
import DashboardTopbar from '../components/DashboardTopbar.jsx'
import GroupDetailPanel from '../components/progress/GroupDetailPanel.jsx'
import GroupProgressCard from '../components/progress/GroupProgressCard.jsx'
import ProgressStatCard from '../components/progress/ProgressStatCard.jsx'
import '../progress.css'

const FILTERS = [
  ['ALL', 'All groups'],
  ['INCOMPLETE', 'Incomplete'],
  ['NOT_SUBMITTED', 'Not submitted'],
  ['SUBMITTED', 'Submitted'],
  ['LATE', 'Late'],
  ['NOT_REVIEWED', 'Not reviewed'],
  ['REVIEWED', 'Reviewed'],
  ['NO_RECEIVED_REVIEW', 'No received review'],
]

function formatDateTime(value) {
  if (!value) return 'Not scheduled'
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
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
      <p>Assessment progress is available only to the lecturer who manages this course.</p>
      <button className="secondary-action" type="button" onClick={() => navigate('/dashboard')}>
        <ArrowLeft size={17} aria-hidden="true" />
        Back to dashboard
      </button>
    </main>
  )
}

function CompletionCard({ title, rate, completed, pending, total, tone }) {
  const safeRate = Math.min(100, Math.max(0, Number(rate ?? 0)))

  return (
    <article className={`completion-card completion-card--${tone}`}>
      <div className="completion-card__heading">
        <div>
          <p>{title}</p>
          <strong>{safeRate.toFixed(2)}%</strong>
        </div>
        <span>{completed} of {total} complete</span>
      </div>
      <div
        className="completion-progress"
        role="progressbar"
        aria-label={title}
        aria-valuenow={safeRate}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <span style={{ width: `${safeRate}%` }} />
      </div>
      <div className="completion-card__footer">
        <span><CheckCircle2 size={15} /> {completed} completed</span>
        <span><Clock3 size={15} /> {pending} remaining</span>
      </div>
    </article>
  )
}

function MonitorProgressPage() {
  const { courseId, assignmentId } = useParams()
  const navigate = useNavigate()
  const { user, token, logout } = useAuth()
  const isLecturer = user.role === 'LECTURER'
  const detailRequestId = useRef(0)
  const [dashboard, setDashboard] = useState(null)
  const [groups, setGroups] = useState([])
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [isLoading, setIsLoading] = useState(isLecturer)
  const [loadError, setLoadError] = useState('')
  const [filterError, setFilterError] = useState('')
  const [isFiltering, setIsFiltering] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [groupDetail, setGroupDetail] = useState(null)
  const [detailError, setDetailError] = useState('')
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  const handleUnauthorized = useCallback((error) => {
    if (error instanceof ApiError && error.status === 401) {
      logout()
      navigate('/login', { replace: true })
      return true
    }
    return false
  }, [logout, navigate])

  useEffect(() => {
    if (!isLecturer) return undefined

    let active = true
    getProgressDashboard(courseId, assignmentId, token)
      .then((data) => {
        if (!active) return
        setDashboard(data)
        setGroups(data.groups)
      })
      .catch((error) => {
        if (!active || handleUnauthorized(error)) return
        setLoadError(error.message)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [assignmentId, courseId, handleUnauthorized, isLecturer, token])

  async function handleFilterChange(filter) {
    if (filter === activeFilter && !filterError) return

    setActiveFilter(filter)
    setIsFiltering(true)
    setFilterError('')

    try {
      const response = await getFilteredProgressGroups(courseId, assignmentId, filter, token)
      setGroups(response.groups)
    } catch (error) {
      if (!handleUnauthorized(error)) setFilterError(error.message)
    } finally {
      setIsFiltering(false)
    }
  }

  async function loadGroupDetail(group) {
    const requestId = detailRequestId.current + 1
    detailRequestId.current = requestId
    setSelectedGroup(group)
    setGroupDetail(null)
    setDetailError('')
    setIsDetailLoading(true)

    try {
      const response = await getGroupMonitoringDetails(assignmentId, group.groupId, token)
      if (detailRequestId.current === requestId) setGroupDetail(response)
    } catch (error) {
      if (detailRequestId.current !== requestId || handleUnauthorized(error)) return
      setDetailError(error.message)
    } finally {
      if (detailRequestId.current === requestId) setIsDetailLoading(false)
    }
  }

  function closeGroupDetail() {
    detailRequestId.current += 1
    setSelectedGroup(null)
    setGroupDetail(null)
    setDetailError('')
    setIsDetailLoading(false)
  }

  const statistics = dashboard?.statistics

  return (
    <div className="dashboard-shell">
      <DashboardTopbar icon={BarChart3} label="Monitor progress" />

      {!isLecturer ? (
        <AccessRestricted />
      ) : (
        <main className="monitor-main">
          <button className="back-link" type="button" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={17} aria-hidden="true" />
            Dashboard
          </button>

          {isLoading ? (
            <section className="monitor-page-state" aria-live="polite">
              <span className="loading-spinner" aria-hidden="true" />
              <h1>Loading assessment progress</h1>
              <p>Collecting submissions, review tasks, and completion statistics.</p>
            </section>
          ) : loadError ? (
            <section className="monitor-page-state monitor-page-state--error">
              <AlertCircle size={28} aria-hidden="true" />
              <h1>Progress data is unavailable</h1>
              <p>{loadError}</p>
              <button className="secondary-action" type="button" onClick={() => window.location.reload()}>
                <RefreshCw size={17} aria-hidden="true" />
                Refresh dashboard
              </button>
            </section>
          ) : dashboard ? (
            <>
              <section className="monitor-header">
                <div>
                  <p className="eyebrow">{dashboard.course.classCode} · {dashboard.course.name}</p>
                  <h1>{dashboard.assignment.title}</h1>
                  <p>Follow submission and peer review completion across every course group.</p>
                  <div className="monitor-header__badges">
                    <span className="monitor-badge monitor-badge--active">{dashboard.course.status.toLowerCase()}</span>
                    <span className="monitor-badge monitor-badge--readonly">Read-only monitoring</span>
                  </div>
                </div>
                <div className="monitor-deadlines" aria-label="Assessment deadlines">
                  <div>
                    <FileClock size={18} aria-hidden="true" />
                    <span>Submission deadline</span>
                    <strong>{formatDateTime(dashboard.assignment.submissionDeadline)}</strong>
                  </div>
                  <div>
                    <ClipboardList size={18} aria-hidden="true" />
                    <span>Review deadline</span>
                    <strong>{formatDateTime(dashboard.assignment.reviewDeadline)}</strong>
                  </div>
                </div>
              </section>

              <section className="completion-grid" aria-label="Completion rates">
                <CompletionCard
                  title="Submission completion"
                  rate={statistics.submissionCompletionRate}
                  completed={statistics.submittedCount}
                  pending={statistics.pendingCount}
                  total={statistics.totalGroups}
                  tone="submission"
                />
                <CompletionCard
                  title="Peer review completion"
                  rate={statistics.peerReviewCompletionRate}
                  completed={statistics.completedReviews}
                  pending={statistics.incompleteReviews}
                  total={statistics.totalReviewAssignments}
                  tone="review"
                />
              </section>

              <section className="monitor-stat-grid" aria-label="Detailed progress statistics">
                <ProgressStatCard icon={UsersRound} label="Total groups" value={statistics.totalGroups} hint="All course groups" tone="neutral" />
                <ProgressStatCard icon={CheckCircle2} label="Submitted" value={statistics.submittedCount} hint="Includes late submissions" tone="positive" />
                <ProgressStatCard icon={Clock3} label="Pending" value={statistics.pendingCount} hint="Missing, draft, or returned" tone="warning" />
                <ProgressStatCard icon={FileWarning} label="Late" value={statistics.lateCount} hint="Marked late submissions" tone="danger" />
                <ProgressStatCard icon={ClipboardList} label="Review tasks" value={statistics.totalReviewAssignments} hint="Active assignments" tone="blue" />
                <ProgressStatCard icon={CheckCircle2} label="Reviews complete" value={statistics.completedReviews} hint="Submitted peer reviews" tone="positive" />
                <ProgressStatCard icon={Clock3} label="Reviews incomplete" value={statistics.incompleteReviews} hint="Still awaiting completion" tone="warning" />
                <ProgressStatCard icon={Inbox} label="No received review" value={statistics.groupsWithNoReceivedReview} hint="Groups needing coverage" tone="danger" />
                <ProgressStatCard icon={AlertCircle} label="Groups with unfinished reviews" value={statistics.groupsWithIncompleteAssignedReviews} hint="Reviewer follow-up needed" tone="yellow" />
              </section>

              <section className="monitor-groups-section" aria-labelledby="group-progress-heading">
                <div className="monitor-section-heading">
                  <div>
                    <p className="eyebrow">Group progress</p>
                    <h2 id="group-progress-heading">Assessment status by group</h2>
                    <p>Filter the live monitoring snapshot and inspect supporting evidence.</p>
                  </div>
                  <span className="monitor-group-count">
                    {isFiltering ? <span className="mini-spinner" aria-hidden="true" /> : groups.length}
                    {isFiltering ? 'Updating' : `${groups.length === 1 ? ' group' : ' groups'}`}
                  </span>
                </div>

                <div className="monitor-filter-bar" aria-label="Progress filters">
                  {FILTERS.map(([value, label]) => (
                    <button
                      className={`monitor-filter-chip ${activeFilter === value ? 'monitor-filter-chip--active' : ''}`}
                      type="button"
                      key={value}
                      aria-pressed={activeFilter === value}
                      disabled={isFiltering}
                      onClick={() => handleFilterChange(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {filterError && (
                  <div className="monitor-inline-error" role="status">
                    <AlertCircle size={18} aria-hidden="true" />
                    <span>{filterError}</span>
                    <button type="button" onClick={() => handleFilterChange(activeFilter)}>Retry</button>
                  </div>
                )}

                {groups.length === 0 && !isFiltering ? (
                  <div className="monitor-empty-groups">
                    <UsersRound size={25} aria-hidden="true" />
                    <h3>No groups match this filter</h3>
                    <p>Choose another progress filter to return to the course overview.</p>
                    <button className="secondary-action" type="button" onClick={() => handleFilterChange('ALL')}>
                      Show all groups
                    </button>
                  </div>
                ) : (
                  <div className={`group-progress-grid ${isFiltering ? 'group-progress-grid--loading' : ''}`}>
                    {groups.map((group) => (
                      <GroupProgressCard
                        key={group.groupId}
                        group={group}
                        onViewDetails={loadGroupDetail}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : null}
        </main>
      )}

      {selectedGroup && (
        <GroupDetailPanel
          groupName={selectedGroup.groupName}
          detail={groupDetail}
          isLoading={isDetailLoading}
          error={detailError}
          onClose={closeGroupDetail}
          onRetry={() => loadGroupDetail(selectedGroup)}
        />
      )}
    </div>
  )
}

export default MonitorProgressPage
