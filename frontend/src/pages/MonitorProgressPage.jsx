import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Bell,
  ClipboardList,
  FileClock,
  ListFilter,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  UsersRound,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import '../progress.css'

const PRIMARY_FILTERS = [
  ['ALL', 'All'],
  ['INCOMPLETE', 'Needs Attention'],
  ['NOT_REVIEWED', 'Review Issues'],
  ['NO_RECEIVED_REVIEW', 'No Received Review'],
]

const SECONDARY_FILTERS = [
  ['SUBMITTED', 'Submitted'],
  ['REVIEWED', 'Reviewed'],
  ['LATE', 'Late'],
  ['NOT_SUBMITTED', 'Not Submitted'],
]

const FILTERS = [...PRIMARY_FILTERS, ...SECONDARY_FILTERS]

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

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

function formatPercent(value) {
  return `${Number(value ?? 0).toFixed(2)}%`
}

function isMissingSubmission(group) {
  return !group.submissionStatus || ['DRAFT', 'RETURNED'].includes(group.submissionStatus)
}

function isReviewed(group) {
  return group.assignedReviewCount > 0 && group.incompleteReviewCount === 0
}

function formatStatus(value, fallback = 'Not submitted') {
  if (!value) return fallback
  return value.replaceAll('_', ' ').toLowerCase()
}

function hasAttentionSignal(group) {
  return isMissingSubmission(group)
    || group.late
    || group.submissionStatus === 'LATE'
    || group.incompleteReviewCount > 0
    || !group.hasReceivedReview
}

function matchesFilter(group, filter) {
  switch (filter) {
    case 'INCOMPLETE':
      return isMissingSubmission(group) || group.incompleteReviewCount > 0
    case 'NOT_SUBMITTED':
      return isMissingSubmission(group)
    case 'SUBMITTED':
      return ['SUBMITTED', 'LATE'].includes(group.submissionStatus)
    case 'LATE':
      return group.late || group.submissionStatus === 'LATE'
    case 'NOT_REVIEWED':
      return group.incompleteReviewCount > 0
    case 'REVIEWED':
      return isReviewed(group)
    case 'NO_RECEIVED_REVIEW':
      return !group.hasReceivedReview
    default:
      return true
  }
}

function buildInsights(statistics) {
  if (!statistics) return []

  const insights = []

  if (statistics.pendingCount > 0) {
    insights.push({
      tone: 'warning',
      title: `${pluralize(statistics.pendingCount, 'group')} not submitted yet.`,
      detail: 'Check these groups before grading or review follow-up.',
    })
  }

  if (statistics.lateCount > 0) {
    insights.push({
      tone: 'danger',
      title: `${pluralize(statistics.lateCount, 'group')} submitted late.`,
      detail: 'Late work may need lecturer review before final grade decisions.',
    })
  }

  if (statistics.incompleteReviews > 0) {
    insights.push({
      tone: 'warning',
      title: `${pluralize(statistics.incompleteReviews, 'review task')} unfinished.`,
      detail: 'Follow up with reviewer groups that still need to submit reviews.',
    })
  }

  if (statistics.groupsWithNoReceivedReview > 0) {
    insights.push({
      tone: 'danger',
      title: `${pluralize(statistics.groupsWithNoReceivedReview, 'group')} has not received any review assignment.`,
      detail: 'Coverage gaps can affect fairness and final review evidence.',
    })
  }

  if (Number(statistics.peerReviewCompletionRate ?? 0) < 100 && statistics.totalReviewAssignments > 0) {
    insights.push({
      tone: 'info',
      title: `Peer review completion is ${formatPercent(statistics.peerReviewCompletionRate)}.`,
      detail: 'Use the review filters to focus on incomplete reviewer work.',
    })
  }

  if (insights.length === 0) {
    insights.push({
      tone: 'positive',
      title: 'No urgent attention items detected.',
      detail: 'Submissions and peer review coverage look complete for this assignment.',
    })
  }

  return insights
}

function getDeadlineLabel(value) {
  if (!value) return 'Not scheduled'

  const deadline = new Date(value)
  const now = new Date()
  const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'Closed'
  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return '1 day left'
  return `${diffDays} days left`
}

function MetricPill({ label, value, tone = 'neutral' }) {
  return (
    <span className={`metric-pill metric-pill--${tone}`}>
      <strong>{value}</strong>
      {label}
    </span>
  )
}

function DecisionKpiCard({ children, icon: Icon, title, tone = 'neutral' }) {
  return (
    <article className={`decision-kpi-card decision-kpi-card--${tone}`}>
      <div className="decision-kpi-card__heading">
        <span className="decision-kpi-card__icon">
          <Icon size={20} aria-hidden="true" />
        </span>
        <h2>{title}</h2>
      </div>
      {children}
    </article>
  )
}

function ProgressKpiCard({ children, detail, headline, rate, title, tone }) {
  const safeRate = Math.min(100, Math.max(0, Number(rate ?? 0)))

  return (
    <DecisionKpiCard icon={TrendingUp} title={title} tone={tone}>
      <div className="decision-kpi-card__main">
        <div>
          <strong>{headline}</strong>
          <span>{detail}</span>
        </div>
      </div>
      <div
        className="kpi-progress"
        role="progressbar"
        aria-label={title}
        aria-valuenow={safeRate}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <span style={{ width: `${safeRate}%` }} />
      </div>
      <div className="metric-pill-row">
        <MetricPill label="completion" value={formatPercent(rate)} tone="blue" />
        {children}
      </div>
    </DecisionKpiCard>
  )
}

function AttentionMenu({ insights, isOpen, onToggle }) {
  return (
    <div className="attention-menu">
      <button
        className="attention-menu__button"
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={onToggle}
      >
        <Bell size={17} aria-hidden="true" />
        Attention
        <strong>{insights.length}</strong>
      </button>

      {isOpen && (
        <div className="attention-menu__panel" role="dialog" aria-label="Attention summary">
          <div className="attention-menu__heading">
            <strong>Attention summary</strong>
            <span>{insights.length} signal{insights.length === 1 ? '' : 's'}</span>
          </div>
          <div className="attention-menu__list">
            {insights.map((insight) => (
              <article className={`attention-menu__item attention-menu__item--${insight.tone}`} key={insight.title}>
                <AlertCircle size={16} aria-hidden="true" />
                <div>
                  <strong>{insight.title}</strong>
                  <p>{insight.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MonitoringContextCard({ assignment, course, insights, isAttentionOpen, onToggleAttention }) {
  return (
    <section className="monitor-context-card" aria-labelledby="monitor-context-heading">
      <div className="monitor-context-card__content">
        <p className="eyebrow">Selected assignment</p>
        <h1 id="monitor-context-heading">Monitor Progress</h1>
        <p>
          Tracking <strong>{assignment.title}</strong> in <strong>{course.name}</strong>.
        </p>
        <div className="monitor-context-card__identity">
          <div>
            <span>Course</span>
            <strong>{course.name}</strong>
          </div>
          <div>
            <span>Class code</span>
            <strong>{course.classCode}</strong>
          </div>
          <div>
            <span>Assignment</span>
            <strong>{assignment.title}</strong>
          </div>
        </div>
      </div>

      <div className="monitor-context-card__actions">
        <AttentionMenu
          insights={insights}
          isOpen={isAttentionOpen}
          onToggle={onToggleAttention}
        />
      </div>

      <div className="monitor-context-card__deadlines" aria-label="Selected assignment deadlines">
        <div>
          <FileClock size={18} aria-hidden="true" />
          <span>Submission deadline</span>
          <strong>{formatDateTime(assignment.submissionDeadline)}</strong>
          <small>{getDeadlineLabel(assignment.submissionDeadline)}</small>
        </div>
        <div>
          <ClipboardList size={18} aria-hidden="true" />
          <span>Review deadline</span>
          <strong>{formatDateTime(assignment.reviewDeadline)}</strong>
          <small>{getDeadlineLabel(assignment.reviewDeadline)}</small>
        </div>
      </div>

      <p className="monitor-context-card__note">
        Choose another course or assignment from the course workspace.
      </p>
    </section>
  )
}

function getAttentionItems(group) {
  const items = []

  if (isMissingSubmission(group)) items.push('Missing submission')
  if (group.late || group.submissionStatus === 'LATE') items.push('Late')
  if (group.incompleteReviewCount > 0) items.push('Review pending')
  if (!group.hasReceivedReview) items.push('No received review')

  return items
}

function getSubmissionTone(group) {
  if (group.late || group.submissionStatus === 'LATE') return 'danger'
  if (isMissingSubmission(group)) return 'warning'
  return 'positive'
}

function getReviewTone(group) {
  if (group.assignedReviewCount === 0) return 'neutral'
  if (group.incompleteReviewCount > 0) return 'warning'
  return 'positive'
}

function getReceivedReviewTone(group) {
  return group.hasReceivedReview ? 'positive' : 'warning'
}

function GroupProgressTable({ groups, isFiltering, onViewDetails }) {
  return (
    <div className={`group-progress-table-shell ${isFiltering ? 'group-progress-table-shell--loading' : ''}`}>
      <table className="group-progress-table">
        <thead>
          <tr>
            <th scope="col">Group</th>
            <th scope="col">Submission</th>
            <th scope="col">Assigned Reviews</th>
            <th scope="col">Received Review</th>
            <th scope="col">Attention</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            const attentionItems = getAttentionItems(group)
            const reviewLabel = group.assignedReviewCount === 0
              ? 'No assigned review'
              : `${group.completedReviewCount}/${group.assignedReviewCount} completed`

            return (
              <tr className={attentionItems.length > 0 ? 'group-progress-row--attention' : ''} key={group.groupId}>
                <td data-label="Group">
                  <strong>{group.groupName}</strong>
                  <span>{formatStatus(group.groupStatus, 'group')}</span>
                </td>
                <td data-label="Submission">
                  <span className={`monitor-badge monitor-badge--${getSubmissionTone(group)}`}>
                    {formatStatus(group.submissionStatus)}
                  </span>
                  <small>{group.submittedAt ? formatDateTime(group.submittedAt) : 'No submission time'}</small>
                </td>
                <td data-label="Assigned Reviews">
                  <span className={`monitor-badge monitor-badge--${getReviewTone(group)}`}>
                    {reviewLabel}
                  </span>
                  <small>{group.incompleteReviewCount} unfinished</small>
                </td>
                <td data-label="Received Review">
                  <span className={`monitor-badge monitor-badge--${getReceivedReviewTone(group)}`}>
                    {group.hasReceivedReview ? 'Received' : 'No received review'}
                  </span>
                  <small>{group.receivedReviewCount} received</small>
                </td>
                <td data-label="Attention">
                  {attentionItems.length === 0 ? (
                    <span className="attention-summary attention-summary--clear">On track</span>
                  ) : (
                    <div className="attention-summary-list">
                      {attentionItems.map((item) => (
                        <span className="attention-summary" key={item}>{item}</span>
                      ))}
                    </div>
                  )}
                </td>
                <td data-label="Action">
                  <button className="group-table-action" type="button" onClick={() => onViewDetails(group)}>
                    View details
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
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
  const [isAttentionOpen, setIsAttentionOpen] = useState(false)

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
  const filterCounts = useMemo(() => {
    const sourceGroups = dashboard?.groups ?? []
    return FILTERS.reduce((counts, [value]) => {
      counts[value] = sourceGroups.filter((group) => matchesFilter(group, value)).length
      return counts
    }, {})
  }, [dashboard?.groups])
  const insights = useMemo(() => buildInsights(statistics), [statistics])
  const attentionGroupCount = useMemo(() => {
    const sourceGroups = dashboard?.groups ?? []
    return sourceGroups.filter(hasAttentionSignal).length
  }, [dashboard?.groups])

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
              <MonitoringContextCard
                assignment={dashboard.assignment}
                course={dashboard.course}
                insights={insights}
                isAttentionOpen={isAttentionOpen}
                onToggleAttention={() => setIsAttentionOpen((current) => !current)}
              />

              <section className="monitor-decision-grid" aria-label="Progress decision summary">
                <DecisionKpiCard icon={AlertCircle} title="Needs Attention" tone={attentionGroupCount > 0 ? 'attention' : 'positive'}>
                  <div className="decision-kpi-card__main">
                    <div>
                      <strong>{attentionGroupCount}</strong>
                      <span>{attentionGroupCount === 1 ? 'group needs' : 'groups need'} lecturer follow-up</span>
                    </div>
                  </div>
                  <div className="metric-pill-row">
                    <MetricPill label="missing" value={statistics.pendingCount} tone={statistics.pendingCount > 0 ? 'warning' : 'positive'} />
                    <MetricPill label="late" value={statistics.lateCount} tone={statistics.lateCount > 0 ? 'danger' : 'positive'} />
                    <MetricPill label="reviews" value={statistics.groupsWithIncompleteAssignedReviews} tone={statistics.groupsWithIncompleteAssignedReviews > 0 ? 'warning' : 'positive'} />
                    <MetricPill label="uncovered" value={statistics.groupsWithNoReceivedReview} tone={statistics.groupsWithNoReceivedReview > 0 ? 'danger' : 'positive'} />
                  </div>
                </DecisionKpiCard>

                <ProgressKpiCard
                  title="Submission Status"
                  rate={statistics.submissionCompletionRate}
                  headline={`${statistics.submittedCount} / ${statistics.totalGroups}`}
                  detail="groups submitted for this assignment"
                  tone="submission"
                >
                  <MetricPill label="pending" value={statistics.pendingCount} tone={statistics.pendingCount > 0 ? 'warning' : 'positive'} />
                  <MetricPill label="late" value={statistics.lateCount} tone={statistics.lateCount > 0 ? 'danger' : 'positive'} />
                </ProgressKpiCard>

                <ProgressKpiCard
                  title="Peer Review Status"
                  rate={statistics.peerReviewCompletionRate}
                  headline={`${statistics.completedReviews} / ${statistics.totalReviewAssignments}`}
                  detail="reviews completed for this assignment"
                  tone="review"
                >
                  <MetricPill label="incomplete" value={statistics.incompleteReviews} tone={statistics.incompleteReviews > 0 ? 'warning' : 'positive'} />
                  <MetricPill label="total" value={statistics.totalReviewAssignments} tone="blue" />
                </ProgressKpiCard>
              </section>

              <section className="monitor-groups-section" aria-labelledby="group-progress-heading">
                <div className="monitor-section-heading">
                  <div>
                    <p className="eyebrow">Group progress</p>
                    <h2 id="group-progress-heading">Groups to monitor</h2>
                  </div>
                  <span className="monitor-group-count">
                    {isFiltering ? <span className="mini-spinner" aria-hidden="true" /> : groups.length}
                    {isFiltering ? 'Updating' : `${groups.length === 1 ? ' group' : ' groups'}`}
                  </span>
                </div>

                <div className="monitor-filter-panel" aria-label="Progress filters">
                  <div className="monitor-filter-group">
                    <span className="monitor-filter-group__label">Quick filters</span>
                    <div className="monitor-filter-bar">
                      {PRIMARY_FILTERS.map(([value, label]) => (
                        <button
                          className={`monitor-filter-chip ${activeFilter === value ? 'monitor-filter-chip--active' : ''}`}
                          type="button"
                          key={value}
                          aria-pressed={activeFilter === value}
                          disabled={isFiltering}
                          onClick={() => handleFilterChange(value)}
                        >
                          <ListFilter size={14} aria-hidden="true" />
                          <span>{label}</span>
                          <strong>{filterCounts[value] ?? 0}</strong>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="monitor-filter-group monitor-filter-group--secondary">
                    <span className="monitor-filter-group__label">More filters</span>
                    <div className="monitor-filter-bar">
                      {SECONDARY_FILTERS.map(([value, label]) => (
                        <button
                          className={`monitor-filter-chip monitor-filter-chip--secondary ${activeFilter === value ? 'monitor-filter-chip--active' : ''}`}
                          type="button"
                          key={value}
                          aria-pressed={activeFilter === value}
                          disabled={isFiltering}
                          onClick={() => handleFilterChange(value)}
                        >
                          <span>{label}</span>
                          <strong>{filterCounts[value] ?? 0}</strong>
                        </button>
                      ))}
                    </div>
                  </div>
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
                  <GroupProgressTable
                    groups={groups}
                    isFiltering={isFiltering}
                    onViewDetails={loadGroupDetail}
                  />
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
