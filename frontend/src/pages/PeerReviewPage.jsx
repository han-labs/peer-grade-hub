import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Link2,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getReviewTask, submitReview } from '../api/peerReviewAssignmentApi.js'
import { ApiError, API_BASE_URL } from '../api/httpClient.js'
import { useAuth } from '../auth/useAuth.js'
import DashboardTopbar from '../components/DashboardTopbar.jsx'

function AccessRestricted() {
  const navigate = useNavigate()

  return (
    <main className="restricted-state">
      <span className="restricted-state__icon">
        <ShieldAlert size={28} aria-hidden="true" />
      </span>
      <p className="eyebrow">Student workspace</p>
      <h1>Access restricted</h1>
      <p>Peer review tasks can only be submitted by students.</p>
      <button className="secondary-action" type="button" onClick={() => navigate('/dashboard')}>
        <ArrowLeft size={17} aria-hidden="true" />
        Back to dashboard
      </button>
    </main>
  )
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

function PeerReviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, token, logout } = useAuth()
  const isStudent = user?.role === 'STUDENT'

  const [task, setTask] = useState(null)
  const [isLoading, setIsLoading] = useState(isStudent)
  const [loadError, setLoadError] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const [score, setScore] = useState('')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleApiError(error) {
    if (error instanceof ApiError && error.status === 401) {
      logout()
      navigate('/login', { replace: true })
      return
    }
    setFeedback({ type: 'error', message: error.message })
  }

  useEffect(() => {
    if (!isStudent) return undefined

    let active = true

    getReviewTask(id, token)
      .then((data) => {
        if (!active) return
        setTask(data)
        setSubmitted(data.submitted ?? false)
        if (data.score !== null && data.score !== undefined) setScore(String(data.score))
        if (data.comment !== null && data.comment !== undefined) setComment(data.comment)
      })
      .catch((error) => {
        if (!active) return
        if (error instanceof ApiError && error.status === 401) {
          logout()
          navigate('/login', { replace: true })
          return
        }
        setLoadError(error.message || 'Failed to load review task details.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [id, isStudent, logout, navigate, token])

  // Validations
  const scoreNum = Number(score)
  const isScoreValid =
    score !== '' &&
    !isNaN(scoreNum) &&
    Number.isInteger(scoreNum) &&
    scoreNum >= 0 &&
    scoreNum <= 100

  const isExpired = task?.dueAt ? new Date(task.dueAt) < new Date() : false
  const isCommentValid = comment.trim().length >= 10 && comment.length <= 1000
  const isFormValid = isScoreValid && isCommentValid && !isExpired

  async function handleSubmit(event) {
    event.preventDefault()
    if (!isFormValid || isSubmitting || isExpired) return

    setIsSubmitting(true)
    setFeedback(null)

    try {
      const response = await submitReview(
        id,
        {
          score: parseInt(score, 10),
          comment: comment.trim(),
        },
        token,
      )

      setFeedback({
        type: 'success',
        message: response.message || 'Peer review submitted successfully.',
      })

      // Re-fetch task to refresh details state from the server
      const refreshedTask = await getReviewTask(id, token)
      setTask(refreshedTask)
      setSubmitted(refreshedTask.submitted ?? false)
      if (refreshedTask.score !== null && refreshedTask.score !== undefined) setScore(String(refreshedTask.score))
      if (refreshedTask.comment !== null && refreshedTask.comment !== undefined) setComment(refreshedTask.comment)
    } catch (error) {
      handleApiError(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getAttachmentUrl = (attachment) => {
    const url = attachment.url || attachment.filePath
    const type = attachment.type || attachment.attachmentType
    if (type === 'FILE') {
      if (url?.startsWith('http')) {
        return url
      }
      return `${API_BASE_URL.replace('/api', '')}${url}`
    }
    return url
  }

  return (
    <div className="dashboard-shell">
      <DashboardTopbar icon={ClipboardCheck} label="Submit Peer Review" />

      {!isStudent ? (
        <AccessRestricted />
      ) : (
        <main className="peer-review-main">
          <button className="back-link" type="button" onClick={() => navigate('/peer-review-tasks')}>
            <ArrowLeft size={17} aria-hidden="true" />
            Back to peer reviews
          </button>

          {isLoading ? (
            <section className="peer-page-state" aria-live="polite">
              <span className="loading-spinner" aria-hidden="true" />
              <h1>Loading review task</h1>
              <p>Fetching assignment, submission materials, and rubric criteria.</p>
            </section>
          ) : loadError ? (
            <section className="peer-page-state peer-page-state--error">
              <AlertCircle size={28} aria-hidden="true" />
              <h1>We could not load this review task</h1>
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
          ) : !task ? (
            <section className="peer-page-state">
              <ClipboardCheck size={28} aria-hidden="true" />
              <h1>Review task not found</h1>
              <p>We could not find the details for this peer review task.</p>
            </section>
          ) : (
            <>
              <section className="peer-assignment-header">
                <div>
                  <p className="eyebrow">Peer Review Workspace</p>
                  <h1>Submit Peer Review</h1>
                  <p className="peer-assignment-header__summary">
                    Evaluate the target group's submission fairly. Provide constructiveness in your comments.
                  </p>
                </div>
                <div className="deadline-panel" style={{ color: 'var(--blue)' }}>
                  <ClipboardCheck size={20} aria-hidden="true" />
                  <div>
                    <span>Review Task Status</span>
                    <strong>{submitted ? 'SUBMITTED' : 'PENDING'}</strong>
                  </div>
                  <span
                    className={`deadline-badge deadline-badge--${
                      submitted ? 'open' : 'closed'
                    }`}
                    style={{
                      color: submitted ? 'var(--positive-text)' : 'var(--yellow)',
                      background: submitted ? 'var(--positive-bg)' : 'var(--yellow-soft)',
                    }}
                  >
                    {submitted ? 'Submitted' : 'Pending'}
                  </span>
                </div>
              </section>

              <FeedbackMessage feedback={feedback} />

              <section className="peer-review-layout">
                <div className="peer-review-workspace" style={{ display: 'grid', gap: '24px' }}>
                  {/* Assignment Information Card */}
                  <div className="assignment-form-panel">
                    <div className="panel-heading">
                      <span
                        className="panel-heading__icon"
                        style={{ color: 'var(--blue)', background: 'var(--blue-soft)' }}
                      >
                        <ClipboardCheck size={21} aria-hidden="true" />
                      </span>
                      <div>
                        <p className="eyebrow">Task details</p>
                        <h2>{task.assignment?.title || task.assignmentTitle}</h2>
                        <p>Please review the submission details below before submitting your score.</p>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: '24px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '20px',
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--neutral-text)',
                            display: 'block',
                            fontWeight: 650,
                            textTransform: 'uppercase',
                          }}
                        >
                          Reviewer Group
                        </span>
                        <strong
                          style={{
                            fontSize: '0.94rem',
                            color: 'var(--primary-text)',
                            display: 'block',
                            marginTop: '4px',
                          }}
                        >
                          {task.reviewerGroupName || 'Your Group'}
                        </strong>
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--neutral-text)',
                            display: 'block',
                            fontWeight: 650,
                            textTransform: 'uppercase',
                          }}
                        >
                          Reviewee Group
                        </span>
                        <strong
                          style={{
                            fontSize: '0.94rem',
                            color: 'var(--primary-text)',
                            display: 'block',
                            marginTop: '4px',
                          }}
                        >
                          {task.revieweeGroup?.groupName || task.revieweeGroupName}
                        </strong>
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--neutral-text)',
                            display: 'block',
                            fontWeight: 650,
                            textTransform: 'uppercase',
                          }}
                        >
                          Submission Status
                        </span>
                        <span
                          className={`task-status task-status--${(
                            task.submissionStatus || (task.submission ? 'SUBMITTED' : 'PENDING')
                          ).toLowerCase()}`}
                          style={{ marginTop: '4px' }}
                        >
                          {task.submissionStatus || (task.submission ? 'SUBMITTED' : 'PENDING')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submission Attachments Card */}
                  <div className="assignment-form-panel">
                    <div className="panel-heading">
                      <span
                        className="panel-heading__icon"
                        style={{ color: 'var(--blue)', background: 'var(--blue-soft)' }}
                      >
                        <FileText size={21} aria-hidden="true" />
                      </span>
                      <div>
                        <p className="eyebrow">Submission Material</p>
                        <h2>Attached Files & Links</h2>
                        <p>Access the work submitted by the reviewee group.</p>
                      </div>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                      {!(task.submission?.attachments || task.attachments) ||
                      (task.submission?.attachments || task.attachments).length === 0 ? (
                        <p
                          style={{
                            color: 'var(--neutral-text)',
                            fontSize: '0.84rem',
                            fontStyle: 'italic',
                          }}
                        >
                          No attachments provided for this submission.
                        </p>
                      ) : (
                        <div style={{ display: 'grid', gap: '12px' }}>
                          {(task.submission?.attachments || task.attachments).map((attachment, index) => {
                            const isFile = (attachment.type || attachment.attachmentType) === 'FILE'
                            return (
                              <div
                                key={attachment.id || index}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '12px 16px',
                                  border: '1px solid var(--border-subtle)',
                                  borderRadius: '8px',
                                  background: '#fafbf9',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  {isFile ? (
                                    <FileText size={18} style={{ color: 'var(--blue)' }} />
                                  ) : (
                                    <Link2 size={18} style={{ color: 'var(--blue)' }} />
                                  )}
                                  <div>
                                    <strong
                                      style={{
                                        display: 'block',
                                        fontSize: '0.84rem',
                                        color: 'var(--primary-text)',
                                      }}
                                    >
                                      {attachment.title || attachment.fileName || attachment.label}
                                    </strong>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--neutral-text)' }}>
                                      {attachment.type || attachment.attachmentType}
                                    </span>
                                  </div>
                                </div>
                                <a
                                  href={getAttachmentUrl(attachment)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="compact-primary-action"
                                  style={{
                                    textDecoration: 'none',
                                    height: '34px',
                                    minHeight: '34px',
                                    marginLeft: 'auto',
                                  }}
                                >
                                  Open
                                  <ExternalLink size={14} />
                                </a>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Review Form Card */}
                <aside className="assignment-form-panel" style={{ position: 'sticky', top: '94px' }}>
                  <div className="panel-heading">
                    <span
                      className="panel-heading__icon"
                      style={{ color: 'var(--green)', background: 'var(--green-soft)' }}
                    >
                      <ClipboardCheck size={21} aria-hidden="true" />
                    </span>
                      <div>
                        <p className="eyebrow">Evaluation</p>
                        <h2>Peer Review Form</h2>
                        <p>
                          {submitted
                            ? 'Update your score and feedback.'
                            : 'Provide your score and feedback.'}
                        </p>
                      </div>
                  </div>

                  {isExpired && (
                    <div className="form-alert" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <AlertCircle size={18} />
                      <span>The review deadline has passed. Submission and editing are locked.</span>
                    </div>
                  )}

                  <form
                    onSubmit={handleSubmit}
                    style={{ marginTop: '24px', display: 'grid', gap: '20px' }}
                  >
                    <label className="form-field">
                      <span>Score (0 - 100)</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        disabled={isSubmitting || isExpired}
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        placeholder="Enter integer score"
                        style={{
                          width: '100%',
                          height: '46px',
                          padding: '0 12px',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '10px',
                          background: (isSubmitting || isExpired) ? '#f5f5f5' : '#ffffff',
                        }}
                      />
                    </label>

                    <label className="form-field">
                      <span>Feedback Comments (minimum 10 characters)</span>
                      <textarea
                        required
                        maxLength={1000}
                        disabled={isSubmitting || isExpired}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Explain your evaluation..."
                        style={{
                          width: '100%',
                          minHeight: '120px',
                          padding: '12px',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '10px',
                          background: (isSubmitting || isExpired) ? '#f5f5f5' : '#ffffff',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                          fontSize: '0.84rem',
                        }}
                      />
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.7rem',
                          color: 'var(--neutral-text)',
                          marginTop: '4px',
                        }}
                      >
                        <div>
                          {comment.trim().length > 0 && comment.trim().length < 10 && (
                            <span style={{ color: 'var(--negative-text)' }}>Comment must be at least 10 characters.</span>
                          )}
                        </div>
                        <div>
                          {comment.length} / 1000 characters
                        </div>
                      </div>
                    </label>

                    <button
                      type="submit"
                      className="primary-button"
                      disabled={isSubmitting || !isFormValid || isExpired}
                      style={{ marginTop: '8px' }}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="button-spinner" aria-hidden="true" />
                          {submitted ? 'Updating...' : 'Submitting...'}
                        </>
                      ) : (
                        submitted ? 'Update Review' : 'Submit Review'
                      )}
                    </button>
                  </form>
                </aside>
              </section>
            </>
          )}
        </main>
      )}
    </div>
  )
}

export default PeerReviewPage
