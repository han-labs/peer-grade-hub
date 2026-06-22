import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileCheck2,
  Inbox,
  ScanSearch,
} from 'lucide-react'

function humanize(value, fallback = 'Not submitted') {
  return value?.replaceAll('_', ' ').toLowerCase() ?? fallback
}

function formatDateTime(value) {
  if (!value) return 'No submission recorded'
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function GroupProgressCard({ group, onViewDetails }) {
  const isComplete = group.incompleteReviewCount === 0 && group.assignedReviewCount > 0

  return (
    <article className="group-progress-card">
      <div className="group-progress-card__heading">
        <div>
          <span className="group-progress-card__label">Course group</span>
          <h3>{group.groupName}</h3>
        </div>
        <span className={`monitor-badge monitor-badge--group-${group.groupStatus.toLowerCase()}`}>
          {humanize(group.groupStatus)}
        </span>
      </div>

      <div className="group-progress-card__status-row">
        <div>
          <span className="group-progress-card__metric-icon">
            <FileCheck2 size={17} aria-hidden="true" />
          </span>
          <div>
            <small>Submission</small>
            <strong>{humanize(group.submissionStatus)}</strong>
          </div>
        </div>
        <span className={`monitor-badge monitor-badge--submission-${(group.submissionStatus ?? 'missing').toLowerCase()}`}>
          {group.late ? 'Late' : group.submissionStatus ? humanize(group.submissionStatus) : 'Pending'}
        </span>
      </div>

      <p className="group-progress-card__time">
        <Clock3 size={14} aria-hidden="true" />
        {formatDateTime(group.submittedAt)}
      </p>

      <div className="group-review-metrics">
        <div>
          <span>Assigned</span>
          <strong>{group.assignedReviewCount}</strong>
        </div>
        <div>
          <span>Completed</span>
          <strong>{group.completedReviewCount}</strong>
        </div>
        <div className={group.incompleteReviewCount > 0 ? 'metric-attention' : ''}>
          <span>Incomplete</span>
          <strong>{group.incompleteReviewCount}</strong>
        </div>
      </div>

      <div className="group-progress-card__coverage">
        {group.hasReceivedReview ? (
          <span className="coverage-indicator coverage-indicator--covered">
            <CheckCircle2 size={16} aria-hidden="true" />
            {group.receivedReviewCount} received review{group.receivedReviewCount === 1 ? '' : 's'}
          </span>
        ) : (
          <span className="coverage-indicator coverage-indicator--missing">
            <Inbox size={16} aria-hidden="true" />
            No received review
          </span>
        )}
        <span className={`review-health ${isComplete ? 'review-health--complete' : ''}`}>
          {isComplete ? <CheckCircle2 size={15} /> : <CircleAlert size={15} />}
          {isComplete ? 'Reviews complete' : 'Needs attention'}
        </span>
      </div>

      <button className="group-detail-button" type="button" onClick={() => onViewDetails(group)}>
        <ScanSearch size={17} aria-hidden="true" />
        View evidence
        <ArrowRight size={16} aria-hidden="true" />
      </button>
    </article>
  )
}

export default GroupProgressCard
