import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquareText,
  RefreshCw,
  Send,
  ShieldCheck,
  TimerReset,
  UserRound,
  X,
} from 'lucide-react'

function formatDateTime(value) {
  if (!value) return 'Not recorded'
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function humanize(value, fallback = 'Not started') {
  return value?.replaceAll('_', ' ').toLowerCase() ?? fallback
}

function humanizeReviewStatus(value) {
  if (value === 'ASSIGNED') return 'not reviewed'
  return humanize(value, 'not reviewed')
}

function EmptyEvidence({ title, description }) {
  return (
    <div className="evidence-empty-state">
      <FileText size={21} aria-hidden="true" />
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}

function getDetailAttentionItems(detail) {
  const items = []

  if (!detail.submission) {
    items.push('No submission')
  } else if (detail.submission.status === 'LATE') {
    items.push('Late submission')
  } else if (['DRAFT', 'RETURNED'].includes(detail.submission.status)) {
    items.push('Submission incomplete')
  }

  const incompleteReviews = detail.outgoingReviews.filter((review) => review.reviewStatus !== 'SUBMITTED')
  if (incompleteReviews.length > 0) {
    items.push(`${incompleteReviews.length} incomplete ${incompleteReviews.length === 1 ? 'review' : 'reviews'}`)
  }

  if (detail.receivedReviewEvidence.length === 0) {
    items.push('No received review')
  }

  return items
}

function GroupDetailPanel({ groupName, detail, isLoading, error, onClose, onRetry }) {
  const attentionItems = detail ? getDetailAttentionItems(detail) : []

  return (
    <div className="monitor-drawer-backdrop" role="presentation">
      <aside
        className="monitor-detail-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="monitor-detail-title"
      >
        <header className="monitor-detail-drawer__header">
          <div>
            <p className="eyebrow">Group evidence</p>
            <h2 id="monitor-detail-title">{detail?.group.name ?? groupName}</h2>
          </div>
          <button className="icon-button" type="button" aria-label="Close group details" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="monitor-detail-drawer__body">
          {isLoading ? (
            <div className="detail-loading-state" aria-live="polite">
              <span className="loading-spinner" aria-hidden="true" />
              <strong>Loading group evidence</strong>
            </div>
          ) : error ? (
            <div className="detail-error-state">
              <AlertCircle size={25} aria-hidden="true" />
              <strong>Evidence unavailable</strong>
              <p>{error}</p>
              <button className="secondary-action" type="button" onClick={onRetry}>
                <RefreshCw size={16} aria-hidden="true" />
                Try again
              </button>
            </div>
          ) : detail ? (
            <>
              <section className="detail-overview-card" aria-labelledby="detail-overview-heading">
                <div>
                  <p className="eyebrow">Overview</p>
                  <h3 id="detail-overview-heading">{detail.group.name}</h3>
                  <p>
                    Status: {attentionItems.length === 0 ? 'On track' : 'Needs attention'}
                    {' · '}
                    Reason: {attentionItems.length === 0 ? 'No issues found' : attentionItems.join(', ')}
                  </p>
                </div>
                <div className="detail-overview-card__metrics">
                  <span>
                    <strong>{detail.submission ? humanize(detail.submission.status) : 'none'}</strong>
                    Submission
                  </span>
                  <span>
                    <strong>{detail.outgoingReviews.length}</strong>
                    Review tasks
                  </span>
                  <span>
                    <strong>{detail.receivedReviewEvidence.length}</strong>
                    Received evidence
                  </span>
                </div>
                <div className="detail-overview-card__signals">
                  {attentionItems.length === 0 ? (
                    <span className="detail-signal detail-signal--clear">
                      <CheckCircle2 size={15} aria-hidden="true" />
                      On track
                    </span>
                  ) : (
                    attentionItems.map((item) => (
                      <span className="detail-signal" key={item}>
                        <AlertCircle size={15} aria-hidden="true" />
                        {item}
                      </span>
                    ))
                  )}
                </div>
              </section>

              <section className="detail-section" aria-labelledby="submission-detail-heading">
                <div className="detail-section__heading">
                  <span><Send size={18} aria-hidden="true" /></span>
                  <div>
                    <p className="eyebrow">Submission</p>
                    <h3 id="submission-detail-heading">Latest group submission</h3>
                  </div>
                </div>

                {detail.submission ? (
                  <div className="submission-evidence-card">
                    <div className="submission-evidence-card__topline">
                      <span className={`monitor-badge monitor-badge--submission-${detail.submission.status.toLowerCase()}`}>
                        {humanize(detail.submission.status)}
                      </span>
                      <span><Clock3 size={14} /> {formatDateTime(detail.submission.submittedAt)}</span>
                    </div>
                    <dl className="evidence-definition-list">
                      <div>
                        <dt><UserRound size={15} /> Submitted by</dt>
                        <dd>User #{detail.submission.submittedById ?? 'Unknown'}</dd>
                      </div>
                      <div>
                        <dt><MessageSquareText size={15} /> Note</dt>
                        <dd>{detail.submission.note || 'No note provided.'}</dd>
                      </div>
                    </dl>
                  </div>
                ) : (
                  <EmptyEvidence
                    title="No submission recorded"
                    description="No work has been submitted for this assignment."
                  />
                )}
              </section>

              <section className="detail-section" aria-labelledby="outgoing-reviews-heading">
                <div className="detail-section__heading">
                  <span><ShieldCheck size={18} aria-hidden="true" /></span>
                  <div>
                    <p className="eyebrow">Review tasks</p>
                    <h3 id="outgoing-reviews-heading">Review work</h3>
                  </div>
                  <span className="detail-count">{detail.outgoingReviews.length}</span>
                </div>

                {detail.outgoingReviews.length === 0 ? (
                  <EmptyEvidence
                    title="No review tasks"
                    description="No review tasks are currently recorded for this group."
                  />
                ) : (
                  <div className="evidence-list">
                    {detail.outgoingReviews.map((review) => (
                      <article className="outgoing-review-card" key={review.peerReviewAssignmentId}>
                        <div className="outgoing-review-card__heading">
                          <div>
                            <small>Target group</small>
                            <strong>{review.targetGroupName}</strong>
                          </div>
                          <span className={`monitor-badge monitor-badge--review-${(review.reviewStatus ?? review.assignmentStatus).toLowerCase()}`}>
                            {humanizeReviewStatus(review.reviewStatus ?? review.assignmentStatus)}
                          </span>
                        </div>
                        <div className="review-timeline-grid">
                          <span><CalendarClock size={14} /> Started {formatDateTime(review.assignedAt)}</span>
                          <span><TimerReset size={14} /> Due {formatDateTime(review.dueAt)}</span>
                          <span><CheckCircle2 size={14} /> Submitted {formatDateTime(review.submittedAt)}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="detail-section" aria-labelledby="received-evidence-heading">
                <div className="detail-section__heading">
                  <span><MessageSquareText size={18} aria-hidden="true" /></span>
                  <div>
                    <p className="eyebrow">Received feedback</p>
                    <h3 id="received-evidence-heading">Review evidence</h3>
                  </div>
                  <span className="detail-count">{detail.receivedReviewEvidence.length}</span>
                </div>

                {detail.receivedReviewEvidence.length === 0 ? (
                  <EmptyEvidence
                    title="No received review evidence"
                    description="No submitted review evidence is available."
                  />
                ) : (
                  <div className="evidence-list">
                    {detail.receivedReviewEvidence.map((review) => (
                      <article className="received-review-card" key={review.reviewId}>
                        <div className="received-review-card__heading">
                          <div>
                            <small>Reviewer group</small>
                            <strong>{review.reviewerGroupName}</strong>
                          </div>
                          <span className="review-score">
                            {review.score == null ? 'No score' : `${Number(review.score).toFixed(2)} / 100`}
                          </span>
                        </div>
                        <p>{review.comment || 'No review comment provided.'}</p>
                        <div className="received-review-card__footer">
                          <span className={`monitor-badge monitor-badge--review-${review.status.toLowerCase()}`}>
                            {humanize(review.status)}
                          </span>
                          <span><Clock3 size={14} /> {formatDateTime(review.submittedAt)}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

            </>
          ) : null}
        </div>
      </aside>
    </div>
  )
}

export default GroupDetailPanel
