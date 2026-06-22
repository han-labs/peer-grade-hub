import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquareText,
  RefreshCw,
  Scale,
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

function EmptyEvidence({ title, description }) {
  return (
    <div className="evidence-empty-state">
      <FileText size={21} aria-hidden="true" />
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}

function GroupDetailPanel({ groupName, detail, isLoading, error, onClose, onRetry }) {
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
              <p>Collecting submission and peer review records.</p>
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
                    description="This group has not submitted work for the selected assignment."
                  />
                )}
              </section>

              <section className="detail-section" aria-labelledby="outgoing-reviews-heading">
                <div className="detail-section__heading">
                  <span><ShieldCheck size={18} aria-hidden="true" /></span>
                  <div>
                    <p className="eyebrow">Review work</p>
                    <h3 id="outgoing-reviews-heading">Outgoing reviews</h3>
                  </div>
                  <span className="detail-count">{detail.outgoingReviews.length}</span>
                </div>

                {detail.outgoingReviews.length === 0 ? (
                  <EmptyEvidence
                    title="No outgoing review tasks"
                    description="This group has no review tasks for the selected assignment."
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
                            {humanize(review.reviewStatus ?? review.assignmentStatus)}
                          </span>
                        </div>
                        <div className="review-timeline-grid">
                          <span><CalendarClock size={14} /> Assigned {formatDateTime(review.assignedAt)}</span>
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
                    description="No submitted peer review evidence is available for this group."
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

              <section className="detail-section detail-section--decisions" aria-labelledby="decisions-heading">
                <div className="detail-section__heading">
                  <span><Scale size={18} aria-hidden="true" /></span>
                  <div>
                    <p className="eyebrow">Decisions</p>
                    <h3 id="decisions-heading">Lecturer actions</h3>
                  </div>
                </div>
                <div className="deferred-action-grid">
                  <div>
                    <TimerReset size={19} aria-hidden="true" />
                    <strong>Deadline extension</strong>
                    <p>Coming after schema approval</p>
                    <span>Deferred</span>
                  </div>
                  <div>
                    <Scale size={19} aria-hidden="true" />
                    <strong>Grade penalty</strong>
                    <p>Coming after grading policy approval</p>
                    <span>Deferred</span>
                  </div>
                </div>
              </section>
            </>
          ) : null}
        </div>
      </aside>
    </div>
  )
}

export default GroupDetailPanel
