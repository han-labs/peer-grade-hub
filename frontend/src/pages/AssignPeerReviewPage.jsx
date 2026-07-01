import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  RefreshCw,
  ShieldAlert,
  Trash2,
  UsersRound,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createPeerReviewAssignment,
  deletePeerReviewAssignment,
  getPeerReviewAssignmentPageData,
} from '../api/peerReviewAssignmentApi.js'
import { ApiError } from '../api/httpClient.js'
import { useAuth } from '../auth/useAuth.js'
import DashboardTopbar from '../components/DashboardTopbar.jsx'

function formatDateTime(value) {
  if (!value) return 'Not scheduled'

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function statusLabel(status) {
  return status?.replaceAll('_', ' ').toLowerCase() ?? 'unknown'
}

function FeedbackMessage({ feedback }) {
  if (!feedback) return null

  const Icon = feedback.type === 'success' ? CheckCircle2 : AlertCircle

  return (
    <div className={`peer-feedback peer-feedback--${feedback.type}`} role="status">
      <Icon size={19} aria-hidden="true" />
      <span>{feedback.message}</span>
    </div>
  )
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
      <p>Peer review assignments can only be managed by the lecturer who owns the course.</p>
      <button className="secondary-action" type="button" onClick={() => navigate('/dashboard')}>
        <ArrowLeft size={17} aria-hidden="true" />
        Back to dashboard
      </button>
    </main>
  )
}

function AssignPeerReviewPage() {
  const { assignmentId } = useParams()
  const navigate = useNavigate()
  const { user, token, logout } = useAuth()
  const isLecturer = user.role === 'LECTURER'
  const [pageData, setPageData] = useState(null)
  const [isLoading, setIsLoading] = useState(isLecturer)
  const [loadError, setLoadError] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [reviewerGroupId, setReviewerGroupId] = useState('')
  const [targetGroupId, setTargetGroupId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const assignment = pageData?.assignment
  const groups = useMemo(() => pageData?.groups ?? [], [pageData?.groups])

  function navigateBackToPeerReviewWorkspace() {
    if (assignment?.courseId) {
      navigate(`/lecturer/peer-review-assignments/courses/${assignment.courseId}`)
      return
    }
    navigate('/lecturer/peer-review-assignments')
  }

  function handleApiError(error) {
    if (error instanceof ApiError && error.status === 401) {
      logout()
      navigate('/login', { replace: true })
      return
    }

    setFeedback({ type: 'error', message: error.message })
  }

  async function refreshPageData() {
    const data = await getPeerReviewAssignmentPageData(assignmentId, token)
    setPageData(data)
    setLoadError('')
  }

  useEffect(() => {
    if (!isLecturer) return undefined

    let active = true

    getPeerReviewAssignmentPageData(assignmentId, token)
      .then((data) => {
        if (active) setPageData(data)
      })
      .catch((error) => {
        if (!active) return
        if (error instanceof ApiError && error.status === 401) {
          logout()
          navigate('/login', { replace: true })
          return
        }
        setLoadError(error.message)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [assignmentId, isLecturer, logout, navigate, token])

  function handleReviewerChange(event) {
    const nextReviewerId = event.target.value
    setReviewerGroupId(nextReviewerId)
    if (nextReviewerId === targetGroupId) setTargetGroupId('')
  }

  async function handleCreate(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setFeedback(null)

    try {
      const response = await createPeerReviewAssignment(
        assignmentId,
        Number(reviewerGroupId) || null,
        Number(targetGroupId) || null,
        token,
      )
      await refreshPageData()
      setReviewerGroupId('')
      setTargetGroupId('')
      setFeedback({ type: 'success', message: response.message })
    } catch (error) {
      handleApiError(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return

    setDeletingId(pendingDelete.id)
    setFeedback(null)

    try {
      const response = await deletePeerReviewAssignment(pendingDelete.id, token)
      setPendingDelete(null)
      await refreshPageData()
      setFeedback({ type: 'success', message: response.message })
    } catch (error) {
      setPendingDelete(null)
      handleApiError(error)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="dashboard-shell">
      <DashboardTopbar icon={ClipboardCheck} label="Peer review assignments" />

      {!isLecturer ? (
        <AccessRestricted />
      ) : (
        <main className="peer-review-main">
          <button className="back-link" type="button" onClick={navigateBackToPeerReviewWorkspace}>
            <ArrowLeft size={17} aria-hidden="true" />
            Assign Peer Review
          </button>

          {isLoading ? (
            <section className="peer-page-state" aria-live="polite">
              <span className="loading-spinner" aria-hidden="true" />
              <h1>Loading review workspace</h1>
              <p>Gathering assignment details, course groups, and current review pairs.</p>
            </section>
          ) : loadError ? (
            <section className="peer-page-state peer-page-state--error">
              <AlertCircle size={28} aria-hidden="true" />
              <h1>We could not load this assignment</h1>
              <p>{loadError}</p>
              <button
                className="secondary-action"
                type="button"
                onClick={() => window.location.reload()}
              >
                <RefreshCw size={17} aria-hidden="true" />
                Try again
              </button>
            </section>
          ) : (
            <>
              <section className="peer-assignment-header">
                <div>
                  <p className="eyebrow">{assignment.classCode} · {assignment.courseName}</p>
                  <h1>{assignment.title}</h1>
                  <p className="peer-assignment-header__summary">
                    Assign reviewer groups and check which groups still need reviews.
                  </p>
                </div>
                <div className="deadline-panel">
                  <CalendarClock size={20} aria-hidden="true" />
                  <div>
                    <span>Peer review deadline</span>
                    <strong>{formatDateTime(assignment.reviewDeadline)}</strong>
                  </div>
                  <span className={`deadline-badge deadline-badge--${assignment.reviewDeadlineOpen ? 'open' : 'closed'}`}>
                    {assignment.reviewDeadlineOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
              </section>

              <FeedbackMessage feedback={feedback} />

              <section className="peer-review-layout">
                <div className="peer-review-workspace">
                  <form className="assignment-form-panel" onSubmit={handleCreate}>
                    <div className="panel-heading">
                      <span className="panel-heading__icon">
                        <UsersRound size={21} aria-hidden="true" />
                      </span>
                      <div>
                        <p className="eyebrow">New review task</p>
                        <h2>Assign groups</h2>
                        <p>Choose who reviews and whose submission they review.</p>
                      </div>
                    </div>

                    <div className="group-select-grid">
                      <label className="select-field">
                        <span>Reviewer group</span>
                        <select value={reviewerGroupId} onChange={handleReviewerChange}>
                          <option value="">Select reviewer group</option>
                          {groups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name} · {statusLabel(group.status)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <span className="pair-direction" aria-hidden="true">
                        <ArrowRight size={20} />
                      </span>

                      <label className="select-field">
                        <span>Target group</span>
                        <select value={targetGroupId} onChange={(event) => setTargetGroupId(event.target.value)}>
                          <option value="">Select target group</option>
                          {groups.map((group) => (
                            <option
                              key={group.id}
                              value={group.id}
                              disabled={String(group.id) === reviewerGroupId}
                            >
                              {group.name} · {statusLabel(group.status)}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="assignment-form-panel__footer">
                      <p>
                        {assignment.reviewDeadlineOpen
                          ? `${groups.length} course groups available`
                          : 'Assignments are locked after the review deadline.'}
                      </p>
                      <button
                        className="compact-primary-action"
                        type="submit"
                        disabled={isSubmitting || !assignment.reviewDeadlineOpen}
                      >
                        {isSubmitting ? <span className="button-spinner" aria-hidden="true" /> : <ClipboardCheck size={18} aria-hidden="true" />}
                        {isSubmitting ? 'Assigning...' : 'Assign review'}
                      </button>
                    </div>
                  </form>

                  <section className="review-list-section" aria-labelledby="review-list-heading">
                    <div className="section-heading section-heading--aligned">
                      <div>
                        <p className="eyebrow">Current pairings</p>
                        <h2 id="review-list-heading">Current pairings</h2>
                      </div>
                      <span className="count-badge">{pageData.peerReviewAssignments.length} tasks</span>
                    </div>

                    {pageData.peerReviewAssignments.length === 0 ? (
                      <div className="empty-review-state">
                        <ClipboardCheck size={24} aria-hidden="true" />
                        <h3>No review assignments yet</h3>
                        <p>Create the first group pairing using the form above.</p>
                      </div>
                    ) : (
                      <div className="review-assignment-list">
                        {pageData.peerReviewAssignments.map((reviewAssignment) => (
                          <article className="review-assignment-card" key={reviewAssignment.id}>
                            <div className="review-pair">
                              <div>
                                <span>Reviewer</span>
                                <strong>{reviewAssignment.reviewerGroup.name}</strong>
                              </div>
                              <span className="review-pair__arrow"><ArrowRight size={18} /></span>
                              <div>
                                <span>Target</span>
                                <strong>{reviewAssignment.targetGroup.name}</strong>
                              </div>
                            </div>
                            <div className="review-assignment-card__meta">
                              <span className={`task-status task-status--${reviewAssignment.status.toLowerCase()}`}>
                                {statusLabel(reviewAssignment.status)}
                              </span>
                              <span><Clock3 size={15} /> Assigned {formatDateTime(reviewAssignment.assignedAt)}</span>
                              <span><CalendarClock size={15} /> Due {formatDateTime(reviewAssignment.dueAt)}</span>
                            </div>
                            <button
                              className="delete-icon-button"
                              type="button"
                              title="Delete peer review assignment"
                              aria-label={`Delete ${reviewAssignment.reviewerGroup.name} to ${reviewAssignment.targetGroup.name} assignment`}
                              disabled={deletingId === reviewAssignment.id}
                              onClick={() => setPendingDelete(reviewAssignment)}
                            >
                              {deletingId === reviewAssignment.id
                                ? <span className="mini-spinner" aria-hidden="true" />
                                : <Trash2 size={18} aria-hidden="true" />}
                            </button>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                </div>

                <aside className="coverage-panel" aria-labelledby="coverage-heading">
                  <div className="coverage-panel__heading">
                    <span className="coverage-panel__icon">
                      <AlertCircle size={20} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="eyebrow">Review check</p>
                      <h2 id="coverage-heading">Groups still needing reviewers</h2>
                    </div>
                  </div>

                  {pageData.groupsWithoutReceivedReviews.length === 0 ? (
                    <div className="coverage-complete">
                      <CheckCircle2 size={22} aria-hidden="true" />
                      <strong>All groups are covered</strong>
                      <p>Every group has received at least one review assignment.</p>
                    </div>
                  ) : (
                    <>
                      <p className="coverage-panel__intro">
                        These groups still need at least one incoming review.
                      </p>
                      <div className="uncovered-group-list">
                        {pageData.groupsWithoutReceivedReviews.map((group) => (
                          <div className="uncovered-group" key={group.id}>
                            <span>{group.name}</span>
                            <small>{statusLabel(group.status)}</small>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </aside>
              </section>
            </>
          )}
        </main>
      )}

      {pendingDelete && (
        <div className="dialog-backdrop" role="presentation">
          <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
            <span className="confirm-dialog__icon">
              <Trash2 size={22} aria-hidden="true" />
            </span>
            <h2 id="delete-dialog-title">Delete this review assignment?</h2>
            <p>
              {pendingDelete.reviewerGroup.name} will no longer be assigned to review {pendingDelete.targetGroup.name}.
            </p>
            <div className="confirm-dialog__actions">
              <button className="secondary-action" type="button" onClick={() => setPendingDelete(null)}>
                Keep assignment
              </button>
              <button className="danger-action" type="button" onClick={handleDelete}>
                <Trash2 size={17} aria-hidden="true" />
                Delete assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssignPeerReviewPage
