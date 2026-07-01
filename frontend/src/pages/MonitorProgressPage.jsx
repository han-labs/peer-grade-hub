import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
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

function getAttentionPriority(group) {
  return getAttentionItems(group).length
}

function sortGroupsByAttention(groupsToSort) {
  return [...groupsToSort].sort((first, second) => {
    const issueDifference = getAttentionPriority(second) - getAttentionPriority(first)
    if (issueDifference !== 0) return issueDifference

    return first.groupName.localeCompare(second.groupName)
  })
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
      <div className="metric-pill-row">{children}</div>
    </DecisionKpiCard>
  )
}

function MonitoringContextCard({ assignment, course }) {
  return (
    <section className="monitor-context-card monitor-context-card--compact" aria-labelledby="monitor-context-heading">
      <div>
        <p className="progress-breadcrumb">Monitor Progress / {course.name} / {assignment.title}</p>
        <h1 id="monitor-context-heading">{assignment.title}</h1>
        <p>
          {course.classCode} · Submission: {formatDateTime(assignment.submissionDeadline)} · Review: {formatDateTime(assignment.reviewDeadline)}
        </p>
      </div>
    </section>
  )
}

function getAttentionItems(group) {
  const items = []

  if (isMissingSubmission(group)) items.push('Missing submission')
  if (group.late || group.submissionStatus === 'LATE') items.push('Late submission')
  if (group.incompleteReviewCount > 0) items.push('Incomplete reviews')
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
            <th scope="col">Review Tasks</th>
            <th scope="col">Received Review</th>
            <th scope="col">Attention</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            const attentionItems = getAttentionItems(group)
            const visibleAttentionItems = attentionItems.slice(0, 2)
            const hiddenAttentionCount = Math.max(0, attentionItems.length - visibleAttentionItems.length)
            const reviewLabel = group.assignedReviewCount === 0
              ? 'No review task'
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
                <td data-label="Review Tasks">
                  <span className={`monitor-badge monitor-badge--${getReviewTone(group)}`}>
                    {reviewLabel}
                  </span>
                  <small>
                    {group.incompleteReviewCount > 0
                      ? `${group.incompleteReviewCount} incomplete ${group.incompleteReviewCount === 1 ? 'review' : 'reviews'}`
                      : 'No review issue'}
                  </small>
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
                      {visibleAttentionItems.map((item) => (
                        <span className="attention-summary" key={item}>{item}</span>
                      ))}
                      {hiddenAttentionCount > 0 && (
                        <span className="attention-summary">+{hiddenAttentionCount} more</span>
                      )}
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
        setGroups(sortGroupsByAttention(data.groups))
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
      setGroups(sortGroupsByAttention(response.groups))
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
          <button className="back-link" type="button" onClick={() => navigate(`/lecturer/progress/courses/${courseId}`)}>
            <ArrowLeft size={17} aria-hidden="true" />
            Course progress
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
              />

              <section className="monitor-decision-grid" aria-label="Progress decision summary">
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

                <DecisionKpiCard icon={AlertCircle} title="Needs Attention" tone={attentionGroupCount > 0 ? 'attention' : 'positive'}>
                  <div className="decision-kpi-card__main">
                    <div>
                      <strong>{attentionGroupCount}</strong>
                      <span>{attentionGroupCount === 1 ? 'group needs' : 'groups need'} follow-up</span>
                    </div>
                  </div>
                  <div className="metric-pill-row">
                    <MetricPill label="missing submissions" value={statistics.pendingCount} tone={statistics.pendingCount > 0 ? 'warning' : 'positive'} />
                    <MetricPill label="late" value={statistics.lateCount} tone={statistics.lateCount > 0 ? 'danger' : 'positive'} />
                    <MetricPill label="incomplete reviews" value={statistics.groupsWithIncompleteAssignedReviews} tone={statistics.groupsWithIncompleteAssignedReviews > 0 ? 'warning' : 'positive'} />
                    <MetricPill label="no received review" value={statistics.groupsWithNoReceivedReview} tone={statistics.groupsWithNoReceivedReview > 0 ? 'danger' : 'positive'} />
                  </div>
                </DecisionKpiCard>
              </section>

              <section className="monitor-groups-section" aria-labelledby="group-progress-heading">
                <div className="monitor-section-heading">
                  <div>
                    <h2 id="group-progress-heading">Group progress</h2>
                  </div>
                  <span className="monitor-group-count">
                    {isFiltering ? <span className="mini-spinner" aria-hidden="true" /> : groups.length}
                    {isFiltering ? 'Updating' : `${groups.length === 1 ? ' group' : ' groups'}`}
                  </span>
                </div>

                <div className="monitor-filter-panel" aria-label="Progress filters">
                  <div className="monitor-filter-group">
                    <span className="monitor-filter-group__label">Filters</span>
                    <div className="monitor-filter-bar">
                      {FILTERS.map(([value, label]) => (
                        <button
                          className={`monitor-filter-chip ${SECONDARY_FILTERS.some(([secondaryValue]) => secondaryValue === value) ? 'monitor-filter-chip--secondary' : ''} ${activeFilter === value ? 'monitor-filter-chip--active' : ''}`}
                          type="button"
                          key={value}
                          aria-pressed={activeFilter === value}
                          disabled={isFiltering}
                          onClick={() => handleFilterChange(value)}
                        >
                          {value === 'ALL' && <ListFilter size={14} aria-hidden="true" />}
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
