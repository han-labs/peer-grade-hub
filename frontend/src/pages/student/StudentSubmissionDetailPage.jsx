import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit3, ExternalLink, FileText, Trash2 } from 'lucide-react'
import { ApiError } from '../../api/httpClient.js'
import {
  deleteSubmission,
  downloadSubmissionFile,
  getSubmissionDetail,
  getSubmissionPage,
} from '../../api/studentSubmissionApi.js'
import { useAuth } from '../../auth/useAuth.js'
import DashboardTopbar from '../../components/DashboardTopbar.jsx'
import LoadingScreen from '../../components/LoadingScreen.jsx'

function formatDateTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function triggerBlobDownload(blob, fileName) {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}

function AttachmentList({ attachments, onError, token }) {
  if (!attachments?.length) {
    return <p className="submission-muted">No attachments submitted yet.</p>
  }

  return (
    <div className="submission-attachment-list">
      {attachments.map((attachment, index) => {
        const key = attachment.attachmentId ?? `${attachment.attachmentType}-${index}`

        if (attachment.attachmentType === 'LINK') {
          const openUrl = attachment.openUrl || attachment.url
          return (
            <a
              className="submission-attachment-item"
              href={openUrl}
              key={key}
              rel="noreferrer"
              target="_blank"
            >
              <span className="submission-attachment-item__icon">
                <ExternalLink size={17} />
              </span>
              <span>
                <strong>{attachment.title || openUrl}</strong>
                <small>{attachment.label || openUrl}</small>
              </span>
            </a>
          )
        }

        const fileMeta = `${(attachment.fileType || 'file').toUpperCase()} / ${attachment.fileSizeMb ?? 0} MB${
          attachment.label ? ` / ${attachment.label}` : ''
        }`

        return (
          <a
            className="submission-attachment-item"
            href={attachment.downloadUrl || undefined}
            key={key}
            onClick={async (event) => {
              event.preventDefault()
              if (!attachment.downloadUrl) return
              try {
                const { blob, fileName } = await downloadSubmissionFile(attachment.downloadUrl, token)
                triggerBlobDownload(blob, fileName)
              } catch (err) {
                onError?.(err.message || 'File is not available for download.')
              }
            }}
          >
            <span className="submission-attachment-item__icon">
              <FileText size={17} />
            </span>
            <span>
              <strong>{attachment.fileName || attachment.title || 'File attachment'}</strong>
              <small>{attachment.downloadUrl ? `Download file / ${fileMeta}` : fileMeta}</small>
            </span>
          </a>
        )
      })}
    </div>
  )
}

export default function StudentSubmissionDetailPage() {
  const { courseId, assignmentId, submissionId } = useParams()
  const navigate = useNavigate()
  const { token, logout } = useAuth()
  const [submission, setSubmission] = useState(null)
  const [deadlinePassed, setDeadlinePassed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const loadSubmission = useCallback(() => {
    setError('')
    setLoading(true)
    return Promise.all([
      getSubmissionDetail(courseId, assignmentId, submissionId, token),
      getSubmissionPage(assignmentId, token),
    ])
      .then(([detailResponse, pageResponse]) => {
        setSubmission(detailResponse.data)
        setDeadlinePassed(Boolean(pageResponse.data?.deadlinePassed))
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout()
          navigate('/login', { replace: true })
          return
        }
        setError(err.message || 'Submission detail could not be loaded.')
      })
      .finally(() => setLoading(false))
  }, [assignmentId, courseId, logout, navigate, submissionId, token])

  useEffect(() => {
    let mounted = true
    setLoading(true)

    Promise.all([
      getSubmissionDetail(courseId, assignmentId, submissionId, token),
      getSubmissionPage(assignmentId, token),
    ])
      .then(([detailResponse, pageResponse]) => {
        if (!mounted) return
        setSubmission(detailResponse.data)
        setDeadlinePassed(Boolean(pageResponse.data?.deadlinePassed))
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout()
          navigate('/login', { replace: true })
          return
        }
        if (mounted) setError(err.message || 'Submission detail could not be loaded.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [assignmentId, courseId, logout, navigate, submissionId, token])

  const handleDelete = () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this submission? This action cannot be undone.',
    )

    if (!confirmed) return

    setDeleting(true)
    setError('')

    deleteSubmission(courseId, assignmentId, submissionId, token)
      .then(() => navigate('/student/assignments', { replace: true }))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout()
          navigate('/login', { replace: true })
          return
        }
        setError(err.message || 'Submission could not be deleted.')
      })
      .finally(() => setDeleting(false))
  }

  if (loading) return <LoadingScreen label="Loading submission detail..." />

  return (
    <div className="dashboard-shell">
      <DashboardTopbar icon={FileText} label="Submit Assignment" />

      <main className="dashboard-main assignment-submission-page">
        <button className="back-link" type="button" onClick={() => navigate(-1)}>
          <ArrowLeft size={17} />
          Back
        </button>

        {error ? (
          <div className="error-state">
            <p>{error}</p>
            <button className="secondary-action" type="button" onClick={loadSubmission}>
              Retry
            </button>
          </div>
        ) : (
          <>
            <section className="student-participation-header assignment-submission-hero">
              <p className="eyebrow">Submission detail</p>
              <h1>{submission?.groupName || 'Group submission'}</h1>
              <p>Review the submitted work record for your group.</p>
              <div className="submission-meta-row">
                <span className="stat-chip">{submission?.status || 'SUBMISSION'}</span>
                <span className="stat-chip">Assignment #{submission?.assignmentId}</span>
              </div>
            </section>

            <section className="submission-panel current-submission-detail-page">
              <div className="submission-panel__header">
                <div>
                  <p className="eyebrow">Submitted work</p>
                  <h2>Submission #{submission?.submissionId}</h2>
                </div>
                <div className="submission-detail-actions">
                  <button
                    className="secondary-action"
                    type="button"
                    onClick={() => navigate(`/student/assignments/${assignmentId}/submission`)}
                  >
                    <Edit3 size={16} />
                    Edit submission
                  </button>
                  {!deadlinePassed ? (
                    <button
                      className="danger-action"
                      disabled={deleting}
                      type="button"
                      onClick={handleDelete}
                    >
                      <Trash2 size={16} />
                      {deleting ? 'Deleting...' : 'Delete submission'}
                    </button>
                  ) : (
                    <p className="submission-muted">Submission is locked because the deadline has passed.</p>
                  )}
                </div>
              </div>

              <div className="current-submission-detail">
                <dl>
                  <div>
                    <dt>Group</dt>
                    <dd>{submission?.groupName || '-'}</dd>
                  </div>
                  <div>
                    <dt>Submitted by</dt>
                    <dd>{submission?.submittedByName || '-'}</dd>
                  </div>
                  <div>
                    <dt>Submitted at</dt>
                    <dd>{formatDateTime(submission?.submittedAt)}</dd>
                  </div>
                </dl>
                {submission?.note && (
                  <p className="current-submission-note">{submission.note}</p>
                )}
                <AttachmentList attachments={submission?.attachments} onError={setError} token={token} />
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
